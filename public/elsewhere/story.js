/* Elsewhere — original interactive fiction content.
 * All narrative is authored for this prototype; there are no model calls.
 */
window.ELSEWHERE_WORLDS = [
  {
    id: 'no-work', tag: 'THE FUTURE', title: 'No More Work',
    subtitle: 'What would you do with a lifetime of free time?',
    descriptor: 'Seven years after AI made jobs optional, you finally have to decide what freedom is for.',
    tint: '#e2b492', accent: '#f7bda9', reading: 'A soft speculative future',
    chapters: [
      {
        title: 'The Luxury of Tuesday', time: 'YEAR 7 · 9:42 AM',
        scene: 'You wake to sunlight on the ceiling. No alarm. No meetings. Your universal dividend arrived at midnight, as it always does. Seven years ago, humanity stopped working. At first, every day felt like Saturday. Now it is Tuesday, and the freedom feels almost impossibly large. Your friend Sol sends a message: “I found something. Come outside.”',
        choices: [
          {label:'Follow Sol into the city', hint:'See what everyone has been doing', effect:[2,1,0], tag:'city', reply:'You step into a street filled with people making things nobody asked them to make. Someone has turned an old bank into a public swimming pool. Sol is waiting beside a fountain that never stops singing.'},
          {label:'Take the train to the sea', hint:'Maybe today is for disappearing', effect:[1,0,2], tag:'sea', reply:'You board a train without checking where it ends. By noon the windows are full of ocean, and for the first time in weeks, you stop checking the time.'},
          {label:'Stay home and make something', hint:'Do something for no reason at all', effect:[0,2,1], tag:'make', reply:'You dig out a box of paints you bought years ago. The first brushstroke is terrible. The second is worse. By the third, you are laughing.'}
        ]
      },
      {
        title: 'The Museum of Jobs', time: 'DAY 2 · 2:16 PM',
        scene: 'Sol takes you into a building that used to be a headquarters. It is now the Museum of Jobs. Visitors try on office badges, pretend to answer emails, and laugh at old calendar screenshots. In one room, a wall displays a question: “Who are you when nobody needs you to be useful?” A little girl stands in front of it, waiting for an answer.',
        recall: {city:'You recognize the singing fountain from yesterday in a video on the museum wall.',sea:'You still have salt in your hair from the coast.',make:'There is a smudge of blue paint on your sleeve.'},
        choices: [
          {label:'Tell her about the things you love',hint:'Identity beyond productivity',effect:[0,2,1],tag:'love',reply:'You start listing things so small they surprise you: the smell of rain on pavement, someone saving you the window seat, an excellent peach. The little girl adds “a dog that knows my name.”'},
          {label:'Ask her what she thinks',hint:'Maybe she already knows',effect:[2,1,0],tag:'ask',reply:'“I think we make each other less lonely,” she says. You carry the sentence around for the rest of the day like a tiny, warm stone.'},
          {label:'Leave the museum behind',hint:'There is no reason to look backward',effect:[1,0,2],tag:'leave',reply:'Outside, the sky is impossibly blue. For a few hours you let your thoughts become as unstructured as the clouds.'}
        ]
      },
      {
        title: 'An Invitation Without a Salary', time: 'DAY 4 · 11:03 AM',
        scene: 'A neighborhood collective has purchased an abandoned greenhouse. Their idea is strange: a garden where anyone can plant anything, and nothing is sold. They invite you to help. There will be no title, no boss, and no reward beyond the things that grow. Sol smiles. “That sounds suspiciously like work,” you say. “Maybe,” Sol replies. “But this time we get to choose.”',
        recall: {love:'You remember the little girl’s list of things worth loving.',ask:'The child’s answer about loneliness echoes as you read the invitation.',leave:'You wonder whether freedom also means being free to change your mind.'},
        choices: [
          {label:'Help build the garden',hint:'Create something with other people',effect:[0,3,0],tag:'garden',reply:'Your hands hurt by sunset. You are tired in a way that feels unfamiliar and unexpectedly good. Someone has already painted a ridiculous sign: “WELCOME TO NOTHING IMPORTANT.”'},
          {label:'Suggest a traveling garden',hint:'Why should roots stay in one place?',effect:[2,1,1],tag:'travel',reply:'Within an hour you have drawn a plan for gardens on rooftops, boats, and moving platforms. It is wildly impractical. Everyone loves it.'},
          {label:'Decline, and go exploring',hint:'Protect your open horizon',effect:[1,0,3],tag:'explore',reply:'You send a kind no. Then you walk to a neighborhood you have never visited. Not every invitation must become an obligation.'}
        ]
      },
      {
        title: 'The Celebration', time: 'DAY 9 · 8:30 PM',
        scene: 'The city celebrates the anniversary of the last compulsory workday. Lanterns float above the river. There are musicians, dancers, old friends and strangers. Sol asks what you miss from the old world. You think about the years you spent waiting for life to begin, and the peculiar truth that even unlimited freedom does not tell you what to do next.',
        recall: {garden:'There is soil under your nails, even after a long shower.',travel:'The traveling garden has already acquired its first wildly enthusiastic volunteers.',explore:'In your pocket is a ticket from a tiny theater you stumbled into by accident.'},
        choices: [
          {label:'Tell Sol you miss having a direction',hint:'An honest answer',effect:[0,2,1],tag:'direction',reply:'Sol nods. “Then maybe we should invent one. Not forever. Just for tomorrow.” You talk until the lanterns begin going out.'},
          {label:'Dance until morning',hint:'Not everything needs a reason',effect:[2,1,1],tag:'dance',reply:'You dance badly, spectacularly, joyfully. Nobody notices because everyone else is doing exactly the same thing.'},
          {label:'Walk home under the stars',hint:'Let the night remain yours',effect:[1,0,2],tag:'stars',reply:'The empty streets are golden with lamplight. You realize you are not racing toward anything, and the world has not ended.'}
        ]
      }
    ]
  },
  {
    id:'bookshop',tag:'THE REINVENTION',title:'Seaside Bookshop',
    subtitle:'You left your old life behind. The sea has other plans.',
    descriptor:'A small bookshop, a town of strangers, and the unanswered question of whether leaving means arriving.',
    tint:'#79bdba',accent:'#aee1d5',reading:'An intimate coastal story',
    chapters:[
      {
        title:'The Shop With No Customers',time:'MONDAY · 7:08 AM',
        scene:'On your first morning in Bellwether Cove, a gull steals your croissant. The keys to your new bookshop are cold in your palm. You have traded a busy city for a crooked doorway, three hundred dusty novels, and a view of the sea. There is a note taped to the register: “The shop has been waiting for you. — M.” The bell above the door rings, though no one has entered.',
        choices:[
          {label:'Follow the sound upstairs',hint:'Find out what the building remembers',effect:[2,0,1],tag:'upstairs',reply:'Behind a stack of atlases, you find a tiny door and a room filled with handwritten letters. Every envelope is addressed to “whoever comes next.”'},
          {label:'Open the shop early',hint:'See who the town sends your way',effect:[0,2,1],tag:'open',reply:'Your first customer is an elderly fisherman who asks for a book he already owns. “I just wanted to meet the new person,” he admits.'},
          {label:'Walk barefoot to the shoreline',hint:'A new beginning can wait',effect:[1,0,2],tag:'shore',reply:'You reach the water just as a fishing boat returns. A woman in a yellow raincoat waves, as though she has known you forever.'}
        ]
      },
      {
        title:'The Woman in the Yellow Coat',time:'TUESDAY · 4:22 PM',
        scene:'Her name is Mara. She repairs boats, plays the cello badly, and knows the story behind every shop window. She brings you a basket of oranges and an offer: come to the night market, where nobody is allowed to ask what you used to do for a living. You look around the shop. It still smells of paint, paper, and uncertainty.',
        recall:{upstairs:'The unread letters upstairs make the old building feel like a friend with secrets.',open:'Your fisherman customer has left a shell on the counter as a welcome gift.',shore:'You recognize Mara from the shoreline yesterday.'},
        choices:[
          {label:'Go to the night market',hint:'Let yourself be a newcomer',effect:[1,2,0],tag:'market',reply:'Strangers hand you hot bread and a paper crown. Mara tells everyone you are the keeper of stories now. You almost believe her.'},
          {label:'Ask Mara to help in the shop',hint:'Start building something together',effect:[0,3,0],tag:'team',reply:'You spend the evening making a handwritten display called “Books for people beginning again.” Someone leaves a thank-you note before closing.'},
          {label:'Say you need a night alone',hint:'Learn how to enjoy your own company',effect:[1,0,2],tag:'alone',reply:'You read on the floor until the tide turns. It is the first time in months that solitude does not feel like an empty room.'}
        ]
      },
      {
        title:'A Letter to the Person Who Arrives',time:'THURSDAY · 10:15 AM',
        scene:'A storm closes the harbor. Rain rattles the windows, and not a single customer comes in. While moving a shelf, you find a letter written by the previous owner. “It will be tempting to make this place perfect,” it says. “Please make it yours instead.” Beneath the letter is a photograph of the shop, decades ago, full of laughing people.',
        recall:{market:'You are still wearing the ridiculous paper crown from the market.',team:'The handwritten book display has become your favorite part of the shop.',alone:'Last night’s solitude has left you feeling surprisingly rested.'},
        choices:[
          {label:'Host a storm-night reading',hint:'Make room for everyone',effect:[1,3,0],tag:'reading',reply:'Six soaked neighbors arrive. By midnight there are twenty. The shop feels less like a business and more like a light left on.'},
          {label:'Write a letter to your future self',hint:'Put this moment into words',effect:[1,0,2],tag:'letter',reply:'You seal the letter behind a loose floorboard. You tell your future self to remember this exact smell of rain and paper.'},
          {label:'Redesign the window display',hint:'Give the town something unexpected',effect:[2,1,0],tag:'window',reply:'You turn the window into an ocean of paper boats. By morning, children have added their own.'}
        ]
      },
      {
        title:'A Place on the Map',time:'SUNDAY · 6:40 PM',
        scene:'The storm passes. The bookshop has become part of the town’s daily rhythm: a place for lost umbrellas, impromptu conversations and unhurried afternoons. Mara asks whether you plan to stay. The sea is silver. You have learned that starting over does not erase your old life; it makes room around it.',
        recall:{reading:'Someone has pinned a photograph of the storm-night gathering above the door.',letter:'The secret letter is safe beneath the floorboards.',window:'The paper boats in the window have become a small local landmark.'},
        choices:[
          {label:'Tell Mara you want to stay',hint:'Let a new place become home',effect:[0,3,0],tag:'stay',reply:'Mara smiles without saying “I told you so.” Tomorrow you will order more books. Tonight, that is enough.'},
          {label:'Plan a bookshop by the sea festival',hint:'Make the town a little brighter',effect:[2,1,0],tag:'festival',reply:'You draw a terrible poster on the back of a receipt. Mara insists it is perfect. Before sunset, three people volunteer.'},
          {label:'Keep your future undecided',hint:'You can belong without promising forever',effect:[0,1,2],tag:'openfuture',reply:'“That’s an answer too,” Mara says. You watch the boats return, each one carrying a different story.'}
        ]
      }
    ]
  },
  {
    id:'paris',tag:'THE SECOND CHANCE',title:'A Life in Paris',
    subtitle:'An unfamiliar city. An unexpected version of you.',
    descriptor:'A tiny apartment above a bakery, a borrowed bicycle, and a year with no familiar script.',
    tint:'#dd9e9a',accent:'#ffc8a3',reading:'A tender city adventure',
    chapters:[
      {
        title:'The Apartment Above the Bakery',time:'FRIDAY · 6:55 AM',
        scene:'Every morning in Paris begins with the sound of baking trays. Your apartment is small enough that you can reach the kitchen from your bed, but the window overlooks the most beautiful crooked street you have ever seen. You have moved here without a master plan. Downstairs, the baker leaves you a paper bag marked “for the upstairs person.” Inside: one warm pastry and an invitation.',
        choices:[
          {label:'Accept the invitation',hint:'Meet the people downstairs',effect:[1,2,0],tag:'invite',reply:'The baker, Camille, pulls up a stool. By the end of breakfast you know the names of three neighbors and one extremely judgmental cat.'},
          {label:'Go wandering with no destination',hint:'Learn the city by getting lost',effect:[2,0,1],tag:'wander',reply:'You cross a bridge, find a courtyard full of ivy, and lose an entire afternoon without regretting a minute.'},
          {label:'Write a postcard to your old self',hint:'Mark the start of a different chapter',effect:[0,1,2],tag:'postcard',reply:'You write, “I was brave enough to begin.” You leave the postcard on the windowsill where the sunlight can find it.'}
        ]
      },
      {
        title:'The Borrowed Bicycle',time:'SUNDAY · 11:20 AM',
        scene:'Camille lends you a blue bicycle that squeaks on every corner. A handwritten map is clipped to the handlebars. It marks three places: an old cinema, a quiet garden, and a little café with no sign. On the back, Camille has written: “A city becomes yours one small discovery at a time.”',
        recall:{invite:'Camille greets you like an old friend, though you have only just met.',wander:'You know two streets that are not on any tourist map.',postcard:'The postcard still sits in sunlight on your windowsill.'},
        choices:[
          {label:'Visit the forgotten cinema',hint:'Follow a story you do not know',effect:[2,1,0],tag:'cinema',reply:'Only four people are in the theater. At the end, everyone stays to talk. You have found your first Paris ritual.'},
          {label:'Spend the day in the garden',hint:'Let the afternoon unfold slowly',effect:[0,0,3],tag:'garden',reply:'You read six pages of a book, then spend two hours watching people pass. It feels oddly productive.'},
          {label:'Find the café with no sign',hint:'Say yes to a new connection',effect:[1,3,0],tag:'cafe',reply:'A woman at the next table asks to share your newspaper. Her name is Léa, and she has very strong opinions about the weather.'}
        ]
      },
      {
        title:'A Seat at the Table',time:'WEDNESDAY · 8:10 PM',
        scene:'The neighbors invite you to a rooftop dinner. Someone brings homemade soup; someone else brings a record player. You are still translating half the conversation in your head. For a moment you feel out of place, until a hand reaches across the table to pass you the bread as though you have always belonged here.',
        recall:{cinema:'You recognize someone from the little cinema across the table.',garden:'A sprig of rosemary from the quiet garden is tucked into your pocket.',cafe:'Léa is here, telling a dramatically exaggerated story about the café.'},
        choices:[
          {label:'Tell a story about home',hint:'Let people know the person you were',effect:[0,3,0],tag:'story',reply:'They listen closely. Suddenly your two lives do not feel far apart, but like two rooms in the same house.'},
          {label:'Invite everyone to explore tomorrow',hint:'Turn a good evening into an adventure',effect:[3,1,0],tag:'explore',reply:'You somehow become the organizer of a sunrise walk. Nobody is sure where it will end. Nobody minds.'},
          {label:'Stay quiet and watch the city lights',hint:'Some moments are enough as they are',effect:[0,1,2],tag:'quiet',reply:'The rooftops glow in the dusk. You realize you do not need a remarkable story to deserve a seat here.'}
        ]
      },
      {
        title:'The Shape of Home',time:'SATURDAY · 5:35 PM',
        scene:'Months later, the apartment is still tiny. You now know which bakery closes early, where the best light falls in the afternoon, and how to order coffee without rehearsing first. Camille asks if you have found what you came looking for. You look down the crooked street. You cannot remember what your original answer would have been.',
        recall:{story:'The neighbors have been asking you to tell more stories from home.',explore:'The sunrise walking group now meets every Saturday.',quiet:'You have learned to love the quiet moments between invitations.'},
        choices:[
          {label:'Say: I found people',hint:'Connection was the missing piece',effect:[0,3,0],tag:'people',reply:'Camille places a new pastry on the counter, on the house. “That,” they say, “is a very Parisian answer.”'},
          {label:'Say: I found curiosity',hint:'There is still so much to discover',effect:[3,0,0],tag:'curiosity',reply:'Camille hands you a fresh map, completely blank. “Then keep going.”'},
          {label:'Say: I found myself again',hint:'A quiet kind of arrival',effect:[0,0,3],tag:'self',reply:'The church bells ring six times. You take the long way home, because you can.'}
        ]
      }
    ]
  },
  {
    id:'cabin',tag:'THE QUIET LIFE',title:'Cabin in the Woods',
    subtitle:'A slower world still has things to say.',
    descriptor:'Snow, pine trees, no notifications, and a mystery that arrives in the morning mail.',
    tint:'#94b9bd',accent:'#b9d7c2',reading:'A cozy woodland mystery',
    chapters:[
      {
        title:'The First Snow',time:'DAY 1 · 7:14 AM',
        scene:'Snow has covered the path outside your cabin. There are no unread messages here, no commute and no urgent plans. Only the crackle of the woodstove and the strange feeling that time has slowed down. As you pour coffee, you see a small wooden box on the porch. Inside is a key and a note: “For when you are ready to see the other side of the lake.”',
        choices:[
          {label:'Put on your boots and explore',hint:'Follow the clue through the snow',effect:[3,0,0],tag:'explore',reply:'The forest is so quiet you can hear your own breathing. Between two old pines, a narrow trail leads toward an unfamiliar shore.'},
          {label:'Visit the nearest neighbor',hint:'Someone must know about this key',effect:[1,2,0],tag:'neighbor',reply:'A woman named June opens the door holding two mugs of tea. “Ah,” she says, looking at the key. “It’s your turn.”'},
          {label:'Keep the key and spend the day reading',hint:'You came here for peace',effect:[0,0,3],tag:'read',reply:'You fall asleep under a blanket, the key in your pocket. When you wake, someone has left fresh bread beside the door.'}
        ]
      },
      {
        title:'The Other Side of the Lake',time:'DAY 3 · 12:05 PM',
        scene:'The lake is frozen only at the edges. On the far shore stands a tiny boathouse painted a faded red. The key from the box fits its lock. Inside you find a long table covered in maps, old photographs, and tiny handmade wooden birds. There is a ledger with one sentence on its first page: “A place is kept alive by the people who notice it.”',
        recall:{explore:'You recognize the narrow trail from your first walk.',neighbor:'June has packed you a thermos of spiced tea.',read:'The bread from your porch makes a surprisingly good lunch.'},
        choices:[
          {label:'Study the old maps',hint:'Trace the history of the place',effect:[3,0,0],tag:'maps',reply:'You uncover a path linking several forgotten cabins. Someone has marked each with a little carved bird.'},
          {label:'Invite June to see what you found',hint:'A secret can be shared',effect:[1,3,0],tag:'june',reply:'June sits at the table for a long time. “My father built these birds,” she says. For once, she has no clever remark.'},
          {label:'Carve a small bird of your own',hint:'Take part without solving everything',effect:[0,1,3],tag:'carve',reply:'Your wooden bird is uneven and a little cross-eyed. You place it with the others. Somehow, it belongs.'}
        ]
      },
      {
        title:'A Winter Gathering',time:'DAY 6 · 6:18 PM',
        scene:'A storm is coming, and the neighbors are preparing the old community hall. You had imagined your new life would involve speaking to almost no one. Yet here you are, carrying firewood while people string lights across the beams. June tells you that the hall once stayed closed for ten years. “It reopened because one person decided to turn on the lights.”',
        recall:{maps:'One of the photographs from the boathouse is now pinned by the hall entrance.',june:'June has been unusually thoughtful since visiting the boathouse.',carve:'Your uneven little bird sits proudly on a windowsill.'},
        choices:[
          {label:'Cook for the gathering',hint:'Offer something simple and warm',effect:[0,3,0],tag:'cook',reply:'Your soup is a little too salty. Everyone has seconds anyway. Someone asks you to write down the recipe.'},
          {label:'Organize a midnight walk',hint:'Share the wonder of the woods',effect:[3,1,0],tag:'walk',reply:'You lead a small group through lantern-lit snow. Above the trees, the stars seem close enough to touch.'},
          {label:'Sit near the fire and listen',hint:'Being present is enough',effect:[0,1,3],tag:'listen',reply:'Stories move around the room. You find yourself memorizing the sound of other people laughing.'}
        ]
      },
      {
        title:'When the Lake Thaws',time:'DAY 19 · 9:02 AM',
        scene:'The snow has started to melt. You walk toward the lake and see your reflection on the moving water. The little cabin still feels wonderfully far from the rest of the world. But you no longer think of it as a hiding place. June appears on the path, carrying a fresh wooden bird and two cups of coffee. “What next?” she asks.',
        recall:{cook:'A handwritten recipe card has appeared on your fridge.',walk:'The neighbors still talk about the lantern-lit walk.',listen:'You recognize a familiar laugh before you see June.'},
        choices:[
          {label:'Restore the boathouse',hint:'Preserve a small piece of the past',effect:[1,3,0],tag:'restore',reply:'June hands you a paintbrush. Neither of you has any idea what you are doing. By afternoon, the first wall is red again.'},
          {label:'Follow the old trails',hint:'See what else the forest holds',effect:[3,0,0],tag:'trails',reply:'You tuck the map into your coat. Somewhere beyond the ridge, another small story is waiting.'},
          {label:'Just stay here a little longer',hint:'Let the quiet be your answer',effect:[0,1,3],tag:'still',reply:'You sit beside the water and drink coffee that has gone slightly cold. The day does not need anything more.'}
        ]
      }
    ]
  }
];