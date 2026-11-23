const cloudJson=(body,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store, max-age=0",
    "x-content-type-options":"nosniff",
    "referrer-policy":"no-referrer"
  }
});

async function tokenHash(token){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

export async function catBondCloudSave(request,env){
  if(!env?.DB)return cloudJson({error:"Cloud save storage unavailable"},503);
  if(request.method!=="GET"&&request.method!=="PUT")
    return cloudJson({error:"Method not allowed"},405);

  const match=(request.headers.get("authorization")||"").match(/^Bearer ([A-Za-z0-9_-]{43})$/);
  if(!match)return cloudJson({error:"A valid recovery code is required"},401);

  const keyHash=await tokenHash(match[1]);
  try{
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS cat_bond_cloud_saves (
      key_hash TEXT PRIMARY KEY,
      iv TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      revision INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      byte_length INTEGER NOT NULL
    )`).run();

    if(request.method==="GET"){
      const row=await env.DB.prepare(
        "SELECT iv,ciphertext,revision,updated_at FROM cat_bond_cloud_saves WHERE key_hash=?"
      ).bind(keyHash).first();
      return row
        ?cloudJson({exists:true,iv:row.iv,ciphertext:row.ciphertext,revision:row.revision,updatedAt:row.updated_at})
        :json({exists:false,revision:0});
    }

    const declared=Number(request.headers.get("content-length")||0);
    if(declared>700000)return cloudJson({error:"Save is too large"},413);
    const raw=await request.text();
    const byteLength=new TextEncoder().encode(raw).byteLength;
    if(byteLength>700000)return cloudJson({error:"Save is too large"},413);
    let body;
    try{body=JSON.parse(raw);}catch{return cloudJson({error:"Invalid save payload"},400);}
    const iv=body?.iv,ciphertext=body?.ciphertext,expected=body?.expectedRevision;
    if(typeof iv!=="string"||!/^[A-Za-z0-9_-]{16}$/.test(iv)||
       typeof ciphertext!=="string"||ciphertext.length<24||
       ciphertext.length>680000||!/^[A-Za-z0-9_-]+$/.test(ciphertext)||
       !Number.isSafeInteger(expected)||expected<0)
      return cloudJson({error:"Invalid encrypted save"},400);

    const current=await env.DB.prepare(
      "SELECT revision FROM cat_bond_cloud_saves WHERE key_hash=?"
    ).bind(keyHash).first();
    const currentRevision=current?.revision??0;
    if(currentRevision!==expected)
      return cloudJson({error:"Save changed on another device",conflict:true,revision:currentRevision},409);

    const now=Date.now();
    const saved=await env.DB.prepare(`
      INSERT INTO cat_bond_cloud_saves(key_hash,iv,ciphertext,revision,updated_at,byte_length)
      VALUES(?,?,?,1,?,?)
      ON CONFLICT(key_hash) DO UPDATE SET
        iv=excluded.iv,
        ciphertext=excluded.ciphertext,
        revision=cat_bond_cloud_saves.revision+1,
        updated_at=excluded.updated_at,
        byte_length=excluded.byte_length
      WHERE cat_bond_cloud_saves.revision=?
      RETURNING revision,updated_at
    `).bind(keyHash,iv,ciphertext,now,byteLength,expected).first();

    if(!saved){
      const latest=await env.DB.prepare(
        "SELECT revision FROM cat_bond_cloud_saves WHERE key_hash=?"
      ).bind(keyHash).first();
      return cloudJson({error:"Save changed on another device",conflict:true,revision:latest?.revision??0},409);
    }
    return cloudJson({ok:true,revision:saved.revision,updatedAt:saved.updated_at});
  }catch(error){
    console.warn("Cat Bond cloud save failed",String(error?.message||error).slice(0,160));
    return cloudJson({error:"Cloud save temporarily unavailable"},503);
  }
}
