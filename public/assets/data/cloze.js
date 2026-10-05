// Part 3 — Cloze Test (เติมคำในบทความ)
// แก้ไข/เพิ่มข้อสอบที่ไฟล์นี้ แล้วรัน: npm run validate
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.cloze = [
  {
    topic: "1. EMAIL (1)",
    text: "Hi Tommy,\n\nWe've arrived in Portugal and have moved (0) into our new house at last! The house is quite big, {1} there's plenty of room for you to come and stay. It also has a nice garden and a swimming pool. But {2} best thing about the house is its beautiful views. {3} you're swimming in the pool, you can {4} the mountains of the Serra de Estrella in Portugal and the Sierra Franca in Spain. It's wonderful. The village is nice as well. It's small, but you can {5} what you need at the local shops. There {6} also some cafés and a restaurant. There's even a golf course and a lake next {7} the village.\n\nI hope you can visit us soon!",
    blanks: [
      { c: ["but", "and", "or", "so"], a: 1, e: "and >> ใช้เชื่อม 2 ประโยคคือ 1. the house is quite big กับ 2. there's plenty of room..." },
      { c: ["a", "an", "the", "some"], a: 2, e: "the >> the + best (adj. ขั้นสูงสุด)" },
      { c: ["When", "Where", "Why", "Who"], a: 0, e: "When >> ต้องการ conjunction (When) เพื่อเชื่อม 2 ประโยค" },
      { c: ["see", "climb", "visit", "look"], a: 0, e: "see >> หลัง can ต้องตามด้วย V1 เราใช้ see เพราะกรรมคือ the mountains" },
      { c: ["buy", "sell", "make", "take"], a: 0, e: "buy >> หลัง can คือ V1 ดูกรรมคือ the local shops เราทำอะไรได้บ้างที่ร้านค้านอกจากซื้อ" },
      { c: ["is", "are", "was", "were"], a: 1, e: "are >> There + V. to be เราจะใช้ are เพราะบริบทเป็นปัจจุบัน และนามด้านหลังพหูพจน์" },
      { c: ["in", "on", "at", "to"], a: 3, e: "to >> next + to (แปลว่า ถัดจาก)" }
    ]
  },
  {
    topic: "2. EMAIL (2)",
    text: "Hi! I'm having a great time (0) in Rome. It's hot and sunny and the people {1} very friendly. Yesterday, we {2} to the Coliseum. It was very old {3} really interesting. This afternoon we're going shopping in the local markets. Tomorrow we're {4} to leave Rome in {5} morning and travel {6} train to Venice. We've got some friends there. They're going to take {7} to St Mark's Square. I'd also like a trip on a gondola! See you soon.",
    blanks: [
      { c: ["is", "am", "are", "be"], a: 2, e: "are >> ต้องการ Verb เชื่อม 2 ประโยค ใช้ are เพราะประธาน (people) เป็นพหูพจน์ และเหตุการณ์เป็นปัจจุบัน" },
      { c: ["go", "goes", "went", "going"], a: 2, e: "went >> มีคำบอกเวลา Yesterday จึงต้องใช้ V.2 (went)" },
      { c: ["and", "but", "so", "because"], a: 1, e: "but >> ต้องการ conjunction มาเชื่อมระหว่าง adj. (very old) กับ interesting ด้วยความที่ความหมายขัดแย้งกัน" },
      { c: ["go", "goes", "went", "going"], a: 3, e: "going >> we're + V.ing + to leave เพราะเป็นอนาคตที่วางแผนไว้ จะเกิดแน่นอน" },
      { c: ["a", "an", "the", "-"], a: 2, e: "the >> morning ต้องการ article (the) -> in the morning" },
      { c: ["on", "in", "by", "at"], a: 2, e: "by >> เดินทางโดยพาหนะใช้ by (by train)" },
      { c: ["us", "we", "our", "ours"], a: 0, e: "us >> take เป็นกริยา ต้องการกรรมมาต่อท้าย (us) ซึ่งอ้างอิงจาก We ในประโยคก่อนหน้า" }
    ]
  },
  {
    topic: "3. EMAIL (3)",
    text: "Sorry you haven't heard (0) from me for ages but the thing is, I've moved! It all happened really quickly. I saw this advert on the college noticeboard a few weeks ago. It said that three girls were {1} for someone to share a house with them. Well, I went to see it {2} week and then moved in yesterday! So I've been really busy and that {3} why I haven't been in touch. Anyway, the other girls are really friendly. My room's quite big and there's a sitting room {4} we can all sit and talk together and watch TV. It's so much nicer than living on my {5} , I've already realised {6} much I hated that. Anyway, the question is, when can you come and see me? {7} me a call and I'll tell you where to find me!",
    blanks: [
      { c: ["look", "looks", "looked", "looking"], a: 3, e: "looking >> were + V.ing + for แปลว่า 'หา' คือ look for ต้องเติม ing ให้เข้ากับ verb to be (were)" },
      { c: ["next", "last", "this", "that"], a: 1, e: "last >> last week คือสัปดาห์ที่แล้ว เพราะจบแล้ว ดูจาก went เป็น V.2" },
      { c: ["is", "am", "are", "was"], a: 0, e: "is >> that is why นั่นคือเหตุผลที่ว่า + ประโยค I haven't been in touch (ปัจจุบัน)" },
      { c: ["when", "where", "which", "who"], a: 1, e: "where >> ใช้เชื่อม 2 ประโยค ใช้ where เพราะ a sitting room เป็นสถานที่" },
      { c: ["own", "myself", "alone", "lonely"], a: 0, e: "own >> on my own มีความหมายเหมือน by myself ต่างกันตรง prep." },
      { c: ["how", "what", "why", "when"], a: 0, e: "how >> noun clause เป็นกรรมของประโยคหน้า I have already realized + how much I hated that" },
      { c: ["Take", "Make", "Do", "Give"], a: 3, e: "Give >> give me a call เป็น collocation แปลว่า โทรหาฉันด้วย (ขึ้นต้นด้วยคำสั่ง V1)" }
    ]
  },
  {
    topic: "4. EMAIL (4)",
    text: "Hi!\nMy name's Magda (0) and I'd like to make new friends to email. I'm {1} Poland, but I live in a flat in London. I'm eighteen years {2} and I'm a student at London University. I have one sister. {3} name's Ela and she's fifteen. I don't have {4} brothers. I {5} speak English, French, and Spanish. I like playing tennis and really enjoy {6} to music. I also {7} the guitar quite well and I often go to the cinema. Please write to me!",
    blanks: [
      { c: ["in", "at", "from", "to"], a: 2, e: "from >> I'm + from (ฉันมาจาก)" },
      { c: ["old", "age", "young", "older"], a: 0, e: "old >> 18 years old" },
      { c: ["His", "Her", "My", "Their"], a: 1, e: "Her >> sister เป็นผู้หญิง ต้องการคำแสดงความเป็นเจ้าของนำหน้านาม" },
      { c: ["some", "any", "no", "a"], a: 1, e: "any >> ประโยคปฏิเสธ I don't have ใช้ any" },
      { c: ["can", "do", "am", "have"], a: 0, e: "can >> speak เป็น V.1 ต้องการ V.ช่วย + V.1 (สามารถพูดได้)" },
      { c: ["listen", "listened", "listening", "to listen"], a: 2, e: "listening >> enjoy เป็นกริยาแท้ มากับ gerund (V.ing)" },
      { c: ["play", "do", "make", "listen"], a: 0, e: "play >> ต้องการกริยาแท้ของ I กรรมคือ the guitar (เล่นกีตาร์ ใช้ play)" }
    ]
  },
  {
    topic: "5. EMAIL (5)",
    text: "Hi Ben,\nIt's (0) my birthday and I'm having a party! It's {1} 5th August. That's this Saturday. It {2} at 8 pm at my house. There's going to be a lot {3} friends from my school. I think you know some {4} them. Also, I want {5} go shopping tomorrow. Can you {6} with me to the supermarket? Would you {7} to help me make a cake? We can have fun! See you soon.\nThomas",
    blanks: [
      { c: ["in", "on", "at", "to"], a: 1, e: "on >> วันที่ 5th of August ใช้ preposition 'on'" },
      { c: ["start", "starts", "starting", "started"], a: 1, e: "starts >> กริยาของ it (ถ้าใช้ is จะแปลว่ามันเป็นเวลา 2 ทุ่ม)" },
      { c: ["in", "on", "of", "at"], a: 2, e: "of >> a lot + of + noun" },
      { c: ["in", "of", "to", "for"], a: 1, e: "of >> some of + กรรม (บางคนในนั้น)" },
      { c: ["to", "for", "with", "at"], a: 0, e: "to >> want (กริยาแท้) + to V.1" },
      { c: ["go", "come", "walk", "drive"], a: 1, e: "come >> ไปกับฉัน (ผู้ชวนและผู้ถูกชวนไม่ได้อยู่ที่เดียวกัน ใช้ come)" },
      { c: ["want", "love", "like", "need"], a: 2, e: "like >> would you like คุณอยากจะ ... มั้ย" }
    ]
  },
  {
    topic: "6. EMAIL (6)",
    text: "Dear Tim:\nHow are you? I had a bad cold last week. That's why I didn't call you. But I'm much better now. Can you come {1} our house for lunch on Saturday at about 1 pm? We're going to cook some chicken. We will also have a salad. Sarah and John {2} be there. It's John's birthday. My sister said that she will bake a cake {3} him! Can you please bring a few bottles {4} soda? Please get cold soda because Saturday will {5} a very hot day. I really hope you can come!\nOh, one more thing. {6} will you get to my house, by car or by bus? Call me {7} you need directions.\nCheers,",
    blanks: [
      { c: ["in", "at", "to", "for"], a: 2, e: "to >> come + to + สถานที่ (เหมือน go to)" },
      { c: ["are", "is", "will", "can"], a: 2, e: "will >> be เป็น V.1 ไม่ผัน มาหลัง V.ช่วย ตอบ will เพราะยังไม่เกิด" },
      { c: ["to", "for", "with", "by"], a: 1, e: "for >> bake a cake ให้คน เป็นกริยาไม่มีการเคลื่อนไหว (ทำให้ ใช้ for)" },
      { c: ["in", "of", "for", "with"], a: 1, e: "of >> นามกับนามเชื่อมด้วย 'of' (ขวดของโซดา)" },
      { c: ["is", "be", "have", "make"], a: 1, e: "be >> ตามหลัง will เป็น V.1 ไม่ผัน (แปลว่า 'เป็น')" },
      { c: ["What", "Where", "When", "How"], a: 3, e: "How >> ถามวิธีการเดินทาง (สังเกต by car or by bus?)" },
      { c: ["if", "when", "but", "so"], a: 0, e: "if >> โทรหาฉัน 'ถ้า' คุณต้องการบอกทาง" }
    ]
  },
  {
    topic: "7. MY JOB (A1A2)",
    text: "I've always written stories. When I (0) was a child, I wrote funny poetry and short stories. As I grew {1} , I started reading serious writers like Shakespeare, Tolstoy, and Cervantes. I wrote my first novel for adults {2} I was eighteen. It was very serious and to be honest it wasn't very good, {3} I enjoyed doing it. After {4} , I wrote three more novels. These were {5} than my first one but they still weren't very good. Finally, I decided {6} write a book for teenagers. At last, publishers liked my work. They published it and asked {7} to write more. Today I'm a popular children's writer.",
    blanks: [
      { c: ["in", "on", "up", "out"], a: 2, e: "up >> grew + up (โตขึ้น)" },
      { c: ["where", "when", "which", "who"], a: 1, e: "when >> เชื่อม 2 ประโยค (เขียนตอนที่อายุ 18)" },
      { c: ["and", "but", "so", "because"], a: 1, e: "but >> เชื่อมประโยคขัดแย้ง (มันไม่ดี แต่ฉันสนุก)" },
      { c: ["this", "that", "it", "these"], a: 1, e: "that >> After that = หลังจากนั้น" },
      { c: ["good", "better", "best", "well"], a: 1, e: "better >> มี than เป็นการเปรียบเทียบขั้นกว่า" },
      { c: ["for", "to", "in", "on"], a: 1, e: "to >> คั่น verb แท้ (decided) กับ V.1 (write) ด้วย to" },
      { c: ["I", "my", "mine", "me"], a: 3, e: "me >> ต้องการรูปกรรมของฉัน (ขอให้ฉันเขียนเพิ่ม)" }
    ]
  },
  {
    topic: "8. MY SISTER IS AN ARTIST (A2B1)",
    text: "My sister is a very good artist. She began drawing when she {1} a young girl. My son enjoys art, too, so she is teaching him how {2} draw. He is learning a lot from her. For example, they often go to museums. They walk around and talk about what kinds {3} paintings they like. Sometimes, they spend time in a park, where they sit quietly and draw. My sister teaches my son that it {4} good to learn about nature. They often take long walks to look at trees {5} flowers. Yesterday, my son showed me his picture of a tree. {6} was very beautiful! {7} so happy that my son can learn about art and nature from my sister.",
    blanks: [
      { c: ["is", "was", "are", "were"], a: 1, e: "was >> began เป็น V.2 เหตุการณ์ในอดีต" },
      { c: ["for", "to", "in", "at"], a: 1, e: "to >> how to + V.1 (วิธีการทำ)" },
      { c: ["in", "of", "for", "with"], a: 1, e: "of >> preposition คั่นนามกับนาม (kinds of paintings)" },
      { c: ["is", "am", "are", "be"], a: 0, e: "is >> verb to be นำหน้า adjective (good) เหตุการณ์ปัจจุบัน" },
      { c: ["but", "or", "and", "so"], a: 2, e: "and >> เชื่อมคำนาม 2 ตัว (trees และ flowers)" },
      { c: ["He", "She", "It", "They"], a: 2, e: "It >> สรรพนามแทน his picture of a tree (เอกพจน์)" },
      { c: ["I", "I'm", "My", "Mine"], a: 1, e: "I'm >> am + happy (ฉันมีความสุข) เติมช่องว่างได้ 1 คำจึงใช้ตัวย่อ" }
    ]
  },
  {
    topic: "9. LEARNING A NEW LANGUAGE (A2B1)",
    text: "{1} are many things to keep in mind when you learn a new language. {2} example, you can repeat what you hear. When you listen {3} CDs or watch a movie, don't just listen but try to repeat what people say. Also, try not to think {4} the words in your own language. {5} is always better to think in the foreign language first. If you do this many times, your language skills will soon improve. Last, don't worry when you {6} a mistake. Mistakes {7} absolutely normal as you learn a language, and in fact you can even learn from them.",
    blanks: [
      { c: ["They", "These", "There", "Those"], a: 2, e: "There >> There are = มี (มันมีหลายสิ่งหลายอย่าง)" },
      { c: ["In", "For", "At", "On"], a: 1, e: "For >> For example = ตัวอย่างเช่น" },
      { c: ["at", "for", "to", "in"], a: 2, e: "to >> listen to (ฟัง)" },
      { c: ["to", "about", "for", "in"], a: 1, e: "about >> think about = คิดเกี่ยวกับ" },
      { c: ["This", "That", "He", "It"], a: 3, e: "It >> It is always better... (มันเป็นการดีกว่าเสมอที่จะ...)" },
      { c: ["do", "make", "take", "get"], a: 1, e: "make >> make a mistake (ทำผิดพลาด - collocation)" },
      { c: ["is", "am", "are", "be"], a: 2, e: "are >> Mistakes เป็นประธานพหูพจน์ คู่กับ are" }
    ]
  },
  {
    topic: "10. ANNE AND THE GREEN GABLE (A2B1)",
    text: "Published in 1908, Anne of Green Gables is a book {1} a brave red-haired girl. The story and its main character, Anne, {2} famous around the world. One young girl growing {3} in Argentina decided to read the book {4} English. After finishing the first book, {5} read all eight of the other 'Anne' books. She loved the stories so much that she even colored {6} hair red, like Anne's. Because of her love for the books, she decided to become an English teacher when she got older. Now she works at a university program for students who are learning English. She still reads Anne of Green Gables {7} summer.",
    blanks: [
      { c: ["in", "on", "about", "for"], a: 2, e: "about >> book about... (หนังสือเกี่ยวกับ...)" },
      { c: ["is", "am", "are", "was"], a: 2, e: "are >> ประธาน 2 ตัวคือ The story และ its main character (ใช้ are)" },
      { c: ["in", "on", "up", "out"], a: 2, e: "up >> growing up (เติบโตขึ้น)" },
      { c: ["in", "on", "at", "by"], a: 0, e: "in >> read in English (อ่านเป็นภาษาอังกฤษ)" },
      { c: ["he", "she", "it", "they"], a: 1, e: "she >> สรรพนามแทน One young girl" },
      { c: ["his", "her", "its", "their"], a: 1, e: "her >> แสดงความเป็นเจ้าของของ she (ผมของเธอ)" },
      { c: ["in", "on", "every", "all"], a: 2, e: "every >> every summer (ทุกฤดูร้อน) ไม่มี the จึงไม่ใช้ in" }
    ]
  },
  {
    topic: "11. A ROBBERY (A2B1)",
    text: "A robbery (0) was reported on Spring Street last night. The first police officer to arrive on the scene, Officer Smith said, \"The crime could have happened last night or a week {1} . We just don't know. The owners of the house had been on vacation for ten days.\" The homeowner, Helen Miles, said \"This is {2} worst thing that ever happened to me. They took everything!!!\" Miles added that the thieves stole valuable jewelry that her mother had given her. \"These must {3} be the same criminals who robbed the house down the street. It's a similar scene,\" said Officer Smith. \"We've {4} trying to find these criminals for months.\" Unfortunately, there is {5} much evidence in the case. The police say they will do their best {6} stop the robbers from committing any more crimes. The people in this town shouldn't be afraid {7} anything.",
    blanks: [
      { c: ["ago", "before", "past", "last"], a: 0, e: "ago >> a week ago (เมื่อสัปดาห์ที่ผ่านมา)" },
      { c: ["a", "an", "the", "-"], a: 2, e: "the >> worst เป็น adjective ขั้นสูงสุด ต้องมี the" },
      { c: ["is", "am", "are", "be"], a: 3, e: "be >> หลัง must ตามด้วย V.1 ไม่ผัน (be)" },
      { c: ["be", "been", "being", "was"], a: 1, e: "been >> Have been trying (Present Perfect Continuous)" },
      { c: ["no", "not", "none", "nothing"], a: 1, e: "not >> is not much evidence (ไม่มีหลักฐานมากนัก)" },
      { c: ["for", "to", "in", "on"], a: 1, e: "to >> do their best to stop... (ทำดีที่สุดเพื่อหยุด...)" },
      { c: ["in", "on", "of", "about"], a: 2, e: "of >> afraid of (กลัว...)" }
    ]
  },
  {
    topic: "12. WELCOME TO SUMMER ADVENTURES! (A2B1)",
    text: "If you want a school holiday filled (0) with action, excitement and adventure then you've come to {1} right place. At Summer Adventures we provide adventure activities and outdoor holidays {2} young people of all ages, nationalities, and abilities. It doesn't matter whether you want to come on your {3} or as part of a group, we've got activities for everyone. So if you want to do {4} completely different, make new friends and generally have a great time, this is the place for you. It's a chance to leave your parents at {5} , and have a go at some of the sports you've always wanted to try. And we promise you'll {6} the time of your life! Do you want {7} find out more? Just click here.",
    blanks: [
      { c: ["a", "an", "the", "-"], a: 2, e: "the >> the right place (สถานที่ที่ใช่/เฉพาะเจาะจง)" },
      { c: ["to", "for", "with", "by"], a: 1, e: "for >> provide... for... (จัดหาให้สำหรับ...)" },
      { c: ["own", "self", "alone", "lonely"], a: 0, e: "own >> on your own (ด้วยตัวคุณเอง)" },
      { c: ["anything", "something", "everything", "nothing"], a: 1, e: "something >> do something different (ทำอะไรที่แตกต่างไป)" },
      { c: ["house", "home", "place", "room"], a: 1, e: "home >> leave parents at home (ปล่อยพ่อแม่อยู่บ้าน)" },
      { c: ["do", "make", "take", "have"], a: 3, e: "have >> have the time of your life (สนุกสุดเหวี่ยง)" },
      { c: ["for", "to", "in", "on"], a: 1, e: "to >> want to find out (คั่นกริยาด้วย to)" }
    ]
  },
  {
    topic: "13. STUDENT ECONOMY CARD (A2B1)",
    text: "Have you (0) heard of The Student Economy Card? You can {1} it to get reductions in shops, hotels, restaurants and many other places so you'll be {2} able to save money wherever you go! You can apply {3} for a card if you're a full-time student at a: secondary school, further education college, language school, university... but you do {4} to be at least twelve years of age. The Student Economy Card costs just £10 and it is valid from September of one year {5} December of the following year. So {6} are you waiting for? Just complete the online application form and you will receive a card {7} five days.",
    blanks: [
      { c: ["use", "used", "using", "uses"], a: 0, e: "use >> ตามหลัง can ใช้ V.1 ไม่ผัน (คุณสามารถใช้มัน...)" },
      { c: ["can", "able", "could", "possible"], a: 1, e: "able >> be able to (สามารถ)" },
      { c: ["to", "for", "with", "in"], a: 1, e: "for >> apply for (สมัครเพื่อ...)" },
      { c: ["must", "should", "have", "need"], a: 2, e: "have >> have to be (ต้องเป็น/มีอายุ...)" },
      { c: ["to", "until", "for", "in"], a: 1, e: "until >> from... until... (ตั้งแต่... จนถึง...)" },
      { c: ["who", "where", "what", "why"], a: 2, e: "what >> What are you waiting for? (รออะไรอยู่?)" },
      { c: ["in", "within", "for", "during"], a: 1, e: "within >> within five days (ภายใน 5 วัน)" }
    ]
  },
  {
    topic: "14. EMAIL - A COMPLAINT",
    text: "Dear Sir/Madam,\nI recently went {1} with some friends to your restaurant to celebrate my birthday. I have to say that the experience was very disappointing. {2} of all, the service was very slow and one of the waiters was rude to us. When we asked him for help, he simply repeated {3} was on the menu. In addition, when the food finally came {4} was cold and undercooked. Finally, the bill was too high because we were charged for some food and drink that we {5} not ordered and did not receive. I can assure you that we will never visit your restaurant again and we will definitely {6} recommend it {7} anyone.\n\nYours faithfully,\nJeremy Smith",
    blanks: [
      { c: ["in", "on", "out", "with"], a: 2, e: "out >> go out เป็น collocation หมายถึง ออกไปเที่ยว/ไปข้างนอก" },
      { c: ["First", "One", "Best", "Start"], a: 0, e: "First >> First of all = อย่างแรกเลย/อันดับแรก" },
      { c: ["what", "which", "that", "it"], a: 0, e: "what >> noun clause ทำหน้าที่เป็นกรรมของ repeated (ทวน'สิ่ง'ที่อยู่ในเมนู)" },
      { c: ["it", "this", "that", "they"], a: 0, e: "it >> สรรพนามแทน the food (เอกพจน์) ทำหน้าที่เป็นประธานของ was cold" },
      { c: ["have", "had", "were", "did"], a: 1, e: "had >> Past Perfect (had + V.3) คู่กับ Past Simple (did not receive) ในอดีต" },
      { c: ["no", "not", "none", "never"], a: 1, e: "not >> will definitely not recommend (ปฏิเสธหลัง will)" },
      { c: ["for", "to", "with", "at"], a: 1, e: "to >> recommend something to someone (แนะนำบางสิ่งให้กับใคร)" }
    ]
  },
  {
    topic: "15. EMAIL",
    text: "Dear Anna and Peter,\nIt's {1} been almost {2} a month since my birthday, so it's time to thank you for the lovely book you sent me. {3} was really kind of you! I've already started reading it. I love learning about different countries and this book really made me interested {4} the Mediterranean. It has a warmer climate {5} ours, and the countryside {6} green and hilly.\n{7} you have any plans for the summer? Perhaps we can meet sometime. I hope to see you very soon.",
    blanks: [
      { c: ["be", "been", "was", "is"], a: 1, e: "been >> It's = It has + V.3 (Present Perfect)" },
      { c: ["a", "an", "the", "-"], a: 0, e: "a >> a month (หนึ่งเดือน/เกือบหนึ่งเดือน)" },
      { c: ["It", "That", "This", "He"], a: 0, e: "It >> It was really kind of you! (คุณใจดีจังเลย - โครงสร้าง It was kind of someone)" },
      { c: ["in", "on", "about", "for"], a: 0, e: "in >> interested in (สนใจในเรื่อง...)" },
      { c: ["then", "than", "that", "to"], a: 1, e: "than >> warmer (ขั้นกว่า) ต้องคู่กับ than" },
      { c: ["is", "am", "are", "was"], a: 0, e: "is >> the countryside เป็นนามนับไม่ได้ (เอกพจน์) ใช้ is (บรรยายสภาพปัจจุบัน)" },
      { c: ["Do", "Are", "Have", "Will"], a: 0, e: "Do >> Do you have...? (คุณมี...ไหม?) ถามถึงปัจจุบัน/สิ่งที่มีอยู่" }
    ]
  },
  {
    topic: "16. TEACHING CHILDREN TO COOK (B1)",
    text: "Do you enjoy cooking? Cooking is a fun and useful activity. Even young children can learn how {1} make simple dishes. Kids just love working {2} the kitchen, preparing healthy family meals with their parents. Of course, they also love eating the delicious food they cook all {3} themselves! By the time children are five or six years old, they can read simple recipes. Have them look at a cookbook and choose a dish. Then take them to the store to buy the ingredients. {4} they get home, they can wash any fruits and vegetables. They can stir with a spoon and break {5} egg into a bowl. You can also teach them to set the table before dinner and to {6} the dishes after. They will {7} happy and proud and they will learn something too.",
    blanks: [
      { c: ["for", "to", "in", "of"], a: 1, e: "to >> how to + V.1 (วิธีการทำ)" },
      { c: ["in", "on", "at", "to"], a: 0, e: "in >> in the kitchen (ในห้องครัว)" },
      { c: ["for", "by", "with", "to"], a: 1, e: "by >> by themselves (ด้วยตัวของพวกเขาเอง)" },
      { c: ["When", "Where", "Why", "Who"], a: 0, e: "When >> เมื่อพวกเขากลับถึงบ้าน (ต้องการ conjunction เชื่อมประโยคเงื่อนไขเวลา)" },
      { c: ["a", "an", "the", "-"], a: 1, e: "an >> an egg (ไข่ 1 ฟอง ขึ้นต้นด้วยสระ)" },
      { c: ["do", "make", "wash", "clean"], a: 2, e: "wash >> wash the dishes หรือ do the dishes ก็ได้" },
      { c: ["feel", "make", "be", "get"], a: 0, e: "feel >> feel happy (รู้สึกมีความสุข - feel เป็น linking verb ตามด้วย adj.)" }
    ]
  },
  {
    topic: "17. KORFBALL (B1)",
    text: "Korfball is a team ball game (0) which was invented in 1901 by a school teacher in Amsterdam. In many ways, the game is {1} netball and basketball, the main difference being that it's designed to be played by mixed teams of male and female players. The word 'korf' is Dutch {2} basket.\nEach team consists {3} of four men and four women. The ball has to be passed by hand, {4} than being kicked, and {5} score goals, players need to get the ball in the other team's basket, at the other end of the court.\nThere are European and world championships which take place {6} four years. Korfball is played around the world, but most commonly in the Netherlands and Belgium. It has been played in England {7} the 1940s.",
    blanks: [
      { c: ["as", "like", "same", "similar"], a: 1, e: "like >> is like (เหมือนกับ) ตามด้วยคำนาม (netball and basketball)" },
      { c: ["in", "to", "for", "of"], a: 2, e: "for >> stand for หรือเป็นคำแปลของ (is Dutch for basket = เป็นภาษาดัตช์ของคำว่าตะกร้า)" },
      { c: ["in", "of", "with", "from"], a: 1, e: "of >> consist of (ประกอบด้วย)" },
      { c: ["other", "rather", "better", "more"], a: 1, e: "rather >> rather than (แทนที่จะ)" },
      { c: ["for", "to", "in", "by"], a: 1, e: "to >> to score goals (เพื่อที่จะทำประตู - บอกจุดประสงค์)" },
      { c: ["all", "every", "each", "some"], a: 1, e: "every >> every four years (ทุกๆ 4 ปี)" },
      { c: ["in", "for", "since", "from"], a: 2, e: "since >> since the 1940s (ตั้งแต่ยุค 1940 - ใช้คู่กับ Present Perfect: has been played)" }
    ]
  },
  {
    topic: "18. TRAVEL TIPS (B1)",
    text: "Have you always wanted (0) to get away, but didn't think you could afford to {1} so? There are many ways to travel for less money, as it {2} out, if you aren't afraid to take advantage {3} of unique deals. Many small airlines, for example, offer flight at {4} low prices that they are called \"low-cost airlines.\"\nShould you choose to use these airlines, however, {5} is advised that you plan carefully. A complete trip may cost a little bit more than you expected. Also, you might have to {6} extra on low-cost airlines for services that are free on major airlines. Finally, many low-cost airlines don't fly into major cities, so figuring out how to reach certain destinations can take time.\nStill, for those {7} don't mind some inconveniences, low-cost airlines can make travelling a possibility.",
    blanks: [
      { c: ["do", "make", "be", "get"], a: 0, e: "do >> do so (ทำเช่นนั้น - เลี่ยงการพูดซ้ำประโยคเดิม)" },
      { c: ["turn", "turns", "turned", "turning"], a: 1, e: "turns >> as it turns out (ปรากฏว่า/อย่างที่เห็น - it เป็นประธานเอกพจน์ กริยาเติม s)" },
      { c: ["in", "for", "of", "to"], a: 2, e: "of >> take advantage of (เอาเปรียบ/ใช้ประโยชน์จาก)" },
      { c: ["very", "too", "so", "really"], a: 3, e: "really >> ขยาย low prices (ใช้ really หรือ very ก็ได้ ในที่นี้นิยม really/so)" },
      { c: ["it", "this", "that", "there"], a: 0, e: "it >> it is advised (ถูกแนะนำว่า... - โครงสร้าง passive)" },
      { c: ["pay", "spend", "cost", "buy"], a: 0, e: "pay >> pay extra (จ่ายเงินเพิ่ม)" },
      { c: ["who", "which", "whom", "whose"], a: 0, e: "who >> for those who (สำหรับผู้ที่... - those แทนคน ใช้ relative pronoun 'who')" }
    ]
  },
  {
    topic: "19. FIONA SINGLETON (B1)",
    text: "Fiona Singleton is only eleven years (0) old and she is a brilliant pianist. However, she lives in {1} a small flat that there is certainly no room for a piano. So, {2} single day after school, Fiona rides the bus across town to see her aunt {3} grand piano is always available to her. Sitting {4} by herself in her aunt's enormous living room, she spends an hour concentrating {5} on pieces she needs to perform at her next concert. But then she stays for another hour and plays together with her aunt, who has a successful career {6} as a top concert pianist. Fiona dreams that she will one day lead a life just like her aunt's, but of course in her dreams, she is the best pianist in the {7} wide world!",
    blanks: [
      { c: ["so", "such", "very", "too"], a: 1, e: "such >> such + noun phrase + that (such a small flat that... เล็กซะจนกระทั่ง...)" },
      { c: ["all", "every", "each", "some"], a: 1, e: "every >> every single day (ทุกๆ วัน)" },
      { c: ["who", "which", "whom", "whose"], a: 3, e: "whose >> แสดงความเป็นเจ้าของ (เปียโนของคุณป้า - whose grand piano)" },
      { c: ["on", "in", "by", "at"], a: 2, e: "by >> by herself (ด้วยตัวเธอเอง/ตามลำพัง)" },
      { c: ["in", "on", "at", "to"], a: 1, e: "on >> concentrate on (มีสมาธิจดจ่ออยู่กับ...)" },
      { c: ["like", "as", "for", "with"], a: 1, e: "as >> work as / career as (ทำงานในฐานะ/อาชีพ...)" },
      { c: ["all", "whole", "full", "entire"], a: 1, e: "whole >> the whole wide world (ทั่วทั้งโลกใบนี้)" }
    ]
  },
  {
    topic: "20. FISH AND CHIPS (B2)",
    text: "There (0) is nothing the British like more {1} than fish and chips, but {2} does this dish come from? Fried chips {3} were invented by the French and they became cheap {4} and popular in the north of England in the nineteenth century. Around the same time fried fish was introduced to London, and somebody decided to put the fried fish and chips {5} together. In 1863 a man called Mr. Lees first sold fish and chips in his local market. He later moved the business to a small shop. It {6} had a sign window saying \"This is the first fish and chip shop in the world\". Today {7} are thousands of fish and chip shops across the UK.",
    blanks: [
      { c: ["then", "than", "that", "as"], a: 1, e: "than >> more... than (มากกว่า)" },
      { c: ["when", "why", "where", "how"], a: 2, e: "where >> where does it come from? (มาจากไหน)" },
      { c: ["are", "were", "was", "is"], a: 1, e: "were >> Passive voice ในอดีต (ประธาน Fried chips เป็นพหูพจน์ ใช้ were invented)" },
      { c: ["but", "or", "and", "so"], a: 2, e: "and >> เชื่อม adj. ไปในทิศทางเดียวกัน (cheap and popular)" },
      { c: ["together", "with", "in", "on"], a: 0, e: "together >> put... together (เอามาไว้รวมกัน)" },
      { c: ["have", "has", "had", "was"], a: 2, e: "had >> อดีตของ have (มันมีป้ายหน้าต่าง... - เล่าเรื่องในอดีต)" },
      { c: ["they", "there", "these", "those"], a: 1, e: "there >> there are (มี... - today there are thousands of...)" }
    ]
  },
  {
    topic: "21. HOLIDAY",
    text: "When (0) was the last time you had a holiday? Now think {1} about the last time you went on holiday without packing your phone or computer. Of course, technology is useful. You can keep {2} in touch with people easily and read news {3} on the internet as soon as it happens. However, sometimes there's nothing better {4} than flying off on holiday to escape from everyday life, it's important {5} for holidays to be relaxing though. And this doesn't happen when you know you might be contacted by your boss while you're away. Holidays should also be exciting. They should {6} give you the chance to try something new. So next time you take a break, leave your laptop and phone at home. Remember, most things can wait {7} until you get back.",
    blanks: [
      { c: ["of", "about", "for", "on"], a: 1, e: "about >> think about (คิดเกี่ยวกับ... / think of ก็ใช้ได้ในบางบริบท)" },
      { c: ["in", "on", "with", "at"], a: 0, e: "in >> keep in touch (ติดต่อกันอยู่เสมอ)" },
      { c: ["in", "on", "at", "by"], a: 1, e: "on >> on the internet (บนอินเทอร์เน็ต)" },
      { c: ["then", "than", "that", "as"], a: 1, e: "than >> better than (ดีกว่า)" },
      { c: ["for", "to", "of", "in"], a: 0, e: "for >> important for (สำคัญสำหรับ... - important for holidays to be relaxing)" },
      { c: ["make", "do", "give", "take"], a: 2, e: "give >> give you the chance (ให้โอกาสคุณ)" },
      { c: ["when", "while", "until", "before"], a: 2, e: "until >> wait until (รอจนกระทั่ง...คุณกลับมา)" }
    ]
  },
  {
    topic: "22. THE CALL BOOK REVIEW (B2)",
    text: "The Call is an action murder story. I love action murder stories (0) so I really wanted to read it. Luckily I wasn't disappointed. I thought it was {1} very good. The beginning was great. The idea {2} of someone kidnapping someone is nothing new, but {3} a girl being kidnapped who is able {4} to call the call centre is different. It made the story have a lot {5} of surprises. The best bit was when the girl was able to escape, I was sure she was dead. The only bit I didn't like was {6} the end. I wanted the man to {7} be punished more.",
    blanks: [
      { c: ["so", "too", "very", "much"], a: 2, e: "very >> ขยาย good (very good = ดีมาก)" },
      { c: ["for", "of", "about", "in"], a: 1, e: "of >> The idea of + noun (แนวความคิดเรื่อง...)" },
      { c: ["a", "an", "the", "-"], a: 0, e: "a >> a girl (เด็กผู้หญิงคนหนึ่ง ไม่เจาะจง)" },
      { c: ["for", "to", "with", "in"], a: 1, e: "to >> able to + V.1 (สามารถที่จะ...)" },
      { c: ["in", "of", "for", "with"], a: 1, e: "of >> a lot of (มากมาย)" },
      { c: ["a", "an", "the", "-"], a: 2, e: "the >> the end (ตอนจบ เจาะจง)" },
      { c: ["is", "am", "are", "be"], a: 3, e: "be >> to + be + V.3 (passive voice ไม่ผันหลัง to - to be punished = ถูกลงโทษ)" }
    ]
  },
  {
    topic: "23. JOB APPLICATION (B2)",
    text: "These days jobs are hard to find, but nowadays many job seekers are finding that they don't just have to pass an interview - they have to take a psychometric test as {1} well. Psychometric tests, {2} which look a bit like old-fashioned intelligence tests, are usually taken {3} under exam conditions. They are designed to reveal information about a candidate's attitudes, values, and beliefs and to show whether or {4} not a candidate is suited to a particular job. Over the last 20 years they have become more and more popular, and over 90% of the UK's largest companies use psychometric tests as {5} parts of their recruitment procedure. Many job applicants are afraid {6} of psychometric tests because there is very little you can do to prepare for them. However, employers seem to like them and - for the moment at least - it looks as {7} if they are here to stay.",
    blanks: [
      { c: ["good", "well", "much", "far"], a: 1, e: "well >> as well = ด้วย/เช่นกัน (ท้ายประโยค)" },
      { c: ["who", "which", "that", "what"], a: 1, e: "which >> relative pronoun ขยายสิ่งของ (Psychometric tests, which... สังเกตมี comma หน้าหลัง ใช้ that ไม่ได้)" },
      { c: ["in", "on", "at", "under"], a: 3, e: "under >> under conditions (ภายใต้เงื่อนไข...)" },
      { c: ["not", "no", "none", "never"], a: 0, e: "not >> whether or not (หรือไม่)" },
      { c: ["part", "parts", "party", "partly"], a: 1, e: "parts >> as parts of (เป็นส่วนหนึ่งของ... / ในหนังสืออนุโลม part เอกพจน์ก็ได้)" },
      { c: ["in", "on", "of", "about"], a: 2, e: "of >> afraid of (กลัว...)" },
      { c: ["if", "though", "when", "that"], a: 0, "e": "if >> as if (ราวกับว่า...)" }
    ]
  },
  {
    topic: "24. MY TEACHER (A2)",
    text: "I started school when I was six years old. My teacher's name {1} was Mrs. Smiths. She had long grey hair, and she always {2} wore a black dress and black shoes. She talked and wrote on the blackboard. We didn't talk: we just {3} listened to her, and wrote in {4} our exercise books. I think she wasn't a very happy person, because she {5} never smiled. I {6} didn't like her very much. Now I'm 25 years old, and I'm a teacher, too. I teach a class of six-year-old children. And {7} every day I remember Mrs. Smiths. So, I never wear black {8} clothes, and I smile a lot. The children talk to me, and I listen to {9} them. I think they like me. But of course, I have an easier job {10} than Mrs. Smiths. I only have 20 children in my class - but in her class there {11} were 45!",
    blanks: [
      { c: ["is", "was", "are", "were"], a: 1, e: "was >> เล่าเรื่องในอดีต (เมื่อตอน 6 ขวบ) เอกพจน์ใช้ was" },
      { c: ["wear", "wears", "wore", "wearing"], a: 2, e: "wore >> V.2 ของ wear (อดีต)" },
      { c: ["listen", "listens", "listened", "listening"], a: 2, e: "listened >> V.2 คู่กับ we didn't talk (อดีต)" },
      { c: ["my", "our", "their", "your"], a: 1, e: "our >> ประธานคือ We (สมุดแบบฝึกหัดของพวกเรา)" },
      { c: ["not", "no", "never", "ever"], a: 2, e: "never >> never smiled (ไม่เคยยิ้มเลย)" },
      { c: ["don't", "doesn't", "didn't", "wasn't"], a: 2, e: "didn't >> ปฏิเสธในอดีต (ฉันไม่ค่อยชอบเธอเท่าไหร่ในตอนนั้น)" },
      { c: ["all", "every", "some", "any"], a: 1, e: "every >> every day (ทุกๆ วัน - ตอนนี้ปัจจุบันแล้ว)" },
      { c: ["clothes", "cloth", "clothing", "clothe"], a: 0, e: "clothes >> เสื้อผ้า (ไม่ใส่เสื้อผ้าสีดำ / ในหนังสือตอบ shoes หรือ dresses ก็ได้)" },
      { c: ["they", "their", "them", "theirs"], a: 2, e: "them >> กรรมของ listen to (ฟังพวกเขา/เด็กๆ)" },
      { c: ["then", "than", "that", "to"], a: 1, e: "than >> easier than (ง่ายกว่า - เปรียบเทียบ)" },
      { c: ["is", "was", "are", "were"], a: 3, e: "were >> there were (มี... ในอดีต - เด็ก 45 คน เป็นพหูพจน์)" }
    ]
  },
  {
    topic: "25. MY AMAZING SISTERS (A2)",
    text: "I have two amazing sisters. {1} of them speak French. However, they are both very bad {2} cooking. At the moment, I'm a bit angry {3} Carla, the younger one, because she hasn't sent me an email {4} for two weeks now. They are very hard-working and hardly ever take {5} time off work and they always {6} meet their deadlines. Carla is a doctor, and she has to work very long {7} hours. Samantha is an architect, and she is also {8} under a lot of pressure. Despite all this, my sisters have a lot of energy. In fact, Samantha is {9} going to flamenco classes at the moment. Carla goes to yoga classes twice a week {10} to help her relax. She {11} used to smoke 20 cigarettes a day but now she has given {12} up. Samantha is more creative {13} than her sister. In fact, she makes a lot of her clothes {14} herself. She also really enjoys {15} going to art exhibitions. I think the best thing about my sisters is that they are also best friends.",
    blanks: [
      { c: ["All", "Both", "Each", "Every"], a: 1, e: "Both >> พูดถึงพี่น้อง 2 คน ใช้ Both (ทั้งสองคน)" },
      { c: ["in", "on", "at", "with"], a: 2, e: "at >> bad at (ไม่เก่งในเรื่อง...)" },
      { c: ["for", "with", "to", "about"], a: 1, e: "with >> angry with (โกรธคน) / angry about (โกรธเรื่องอะไร)" },
      { c: ["for", "since", "in", "from"], a: 0, e: "for >> for + ระยะเวลา (for two weeks = เป็นเวลา 2 สัปดาห์)" },
      { c: ["in", "on", "off", "out"], a: 2, e: "off >> take time off (ลางาน/หยุดพักจากงาน)" },
      { c: ["have", "do", "meet", "make"], a: 2, e: "meet >> meet a deadline (ทำงานเสร็จทันเวลา/เส้นตาย)" },
      { c: ["days", "weeks", "hours", "years"], a: 2, e: "hours >> work long hours (ทำงานหลายชั่วโมง/ยาวนาน)" },
      { c: ["in", "on", "at", "under"], a: 3, e: "under >> under pressure (อยู่ภายใต้ความกดดัน)" },
      { c: ["go", "goes", "went", "going"], a: 3, e: "going >> is going to (กำลังไปเรียน)" },
      { c: ["for", "to", "in", "on"], a: 1, e: "to >> help เป็น V.1 จึงต้องเชื่อมด้วย to (เพื่อที่จะช่วย...)" },
      { c: ["use", "uses", "used", "using"], a: 2, e: "used >> used to + V.1 (เคยทำ...แต่ตอนนี้ไม่ได้ทำแล้ว)" },
      { c: ["in", "out", "off", "up"], a: 3, e: "up >> give up (เลิกทำ/ล้มเลิก)" },
      { c: ["then", "than", "that", "as"], a: 1, e: "than >> more + adj. + than (สร้างสรรค์มากกว่า)" },
      { c: ["her", "hers", "herself", "she"], a: 2, e: "herself >> ทำด้วยตัวเอง (makes...herself)" },
      { c: ["go", "goes", "went", "going"], a: 3, e: "going >> enjoy + V.ing (สนุกกับการไป...)" }
    ]
  },
  {
    topic: "26. YOUTUBE (A2)",
    text: "In April 2007, a 16-year-old boy named Charlie McDonnell was studying for his exams. But he was bored, so he turned {1} on his laptop computer. He found a website called YouTube and watched {2} a video of another teenager like him.\nThe teenager was sitting in his bedroom and talking about how bored he was. \"I can do better {3} than that,\" thought Charlie. So he used his laptop and webcam to make his first video, and posted it on YouTube under the name Charlieissocoollike.\nYouTube started in 2005 and is now the world's largest video website. More than 3 billion videos {4} are watched every day on YouTube and a large number of {5} them are video blogs. These are simply videos of people talking to a camera {6} about their lives or things that interest them.\nTwo days {7} after Charlie posted his first video, he had 150 subscribers, so he decided to make more videos. He soon became quite popular. {8} A few months later, Oprah Winfrey, the famous American TV host, showed one of his videos called 'How to be English' {9} on her programme. In this video, Charlie wears a suit and tie and talks in a funny accent.\nHe also shows viewers {10} how to make a cup of tea. Charlie has suddenly become very famous in the United States too.",
    blanks: [
      { c: ["in", "on", "up", "out"], a: 1, e: "on >> turn on = เปิดเครื่องใช้ไฟฟ้า/อิเล็กทรอนิกส์" },
      { c: ["a", "an", "the", "-"], a: 0, e: "a >> a video (วิดีโออันหนึ่ง ไม่ชี้เฉพาะ)" },
      { c: ["then", "than", "that", "this"], a: 1, e: "than >> better than (ดีกว่านั้น)" },
      { c: ["is", "am", "are", "be"], a: 2, e: "are >> are watched (ถูกดู - Passive voice ประธานพหูพจน์)" },
      { c: ["they", "their", "them", "theirs"], a: 2, e: "them >> a large number of + กรรม (them - แทน videos)" },
      { c: ["in", "on", "of", "about"], a: 3, e: "about >> talking about (พูดคุยเกี่ยวกับ...)" },
      { c: ["before", "after", "since", "until"], a: 1, e: "after >> Two days after... (สองวันหลังจากที่...)" },
      { c: ["A", "An", "The", "Some"], a: 0, e: "A >> A few (สองสาม/เล็กน้อย)" },
      { c: ["in", "on", "at", "by"], a: 1, e: "on >> on programme (ในรายการโทรทัศน์)" },
      { c: ["what", "where", "when", "how"], a: 3, e: "how >> show someone how to do something (แสดงวิธีทำ...)" }
    ]
  }
];
