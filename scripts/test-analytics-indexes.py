import sqlite3, pathlib, re
db=sqlite3.connect(":memory:")
db.executescript("CREATE TABLE events(id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT NOT NULL, day TEXT NOT NULL, ts INTEGER NOT NULL, game TEXT, visitor TEXT, view_id TEXT, run_id TEXT, event_name TEXT, kind TEXT, payload TEXT NOT NULL);")
source=pathlib.Path("src/analytics.js").read_text()
sql=pathlib.Path("cloudflare-pages/analytics-indexes.sql").read_text()
# Include timestamps with ties, late-restored historical events, unrelated categories,
# and rows outside the reporting window.
db.executemany("INSERT INTO events(category,day,ts,game,view_id,kind,payload) VALUES (?,?,?,?,?,?,?)", [
 ("arcade" if i%3 else "elsewhere","2026-11-22",1000+(i*7)%20,"cat-bond" if i%5 else "hub",str(i),"visit" if i%4 else "session","{}") for i in range(5000)
])
db.execute("INSERT INTO events(category,day,ts,game,view_id,kind,payload) VALUES('diagnostic','2026-11-22',1010,'cat-bond','probe','visit','{}')")
before=db.execute("SELECT * FROM events ORDER BY id").fetchall()
db.executescript(sql)
db.executescript(sql)
assert db.execute("SELECT * FROM events ORDER BY id").fetchall()==before, "Index migration changed original data"
q=re.search(r'prepare\("(SELECT id,category,day,game,ts,visitor,view_id,run_id,event_name,kind,payload FROM events[^"]+)"\)',source).group(1)
checks=[
(q,("arcade",1005,99999999,99999999),"idx_events_category_ts_id"),
("SELECT kind,payload FROM events WHERE category=? AND view_id=? ORDER BY id ASC LIMIT 4",("diagnostic","probe"),"idx_events_diagnostic_view"),
("DELETE FROM events WHERE category=? AND view_id=?",("diagnostic","probe"),"idx_events_diagnostic_view"),
("SELECT MIN(day) AS firstDay,MAX(day) AS lastDay,COUNT(*) AS rawVisits,COUNT(*) AS pageviews FROM events WHERE category='arcade' AND game='cat-bond' AND kind='visit'",(),"idx_events_catbond_visits_day")
]
for query,args,index in checks:
 plan=" ".join(r[3] for r in db.execute("EXPLAIN QUERY PLAN "+query,args))
 print(plan)
 assert index in plan and "SCAN events" not in plan and "TEMP B-TREE" not in plan, plan
expected=db.execute("SELECT id FROM events WHERE category=? AND ts>=? ORDER BY id DESC",("arcade",1005)).fetchall()
actual=[];cursor=(99999999,99999999)
while True:
 page=db.execute(q,("arcade",1005,*cursor)).fetchall()
 actual.extend((row[0],) for row in page)
 if len(page)<400: break
 cursor=(page[-1][4],page[-1][0])
assert sorted(actual,reverse=True)==expected, "Pagination omitted or duplicated original rows"
print("PASS: index plans, idempotence, exact row preservation, timestamp ties, historical insert order")
