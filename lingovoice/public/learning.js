/* LingoVoice learning.js — P0..P4: từ mới + SRS + error notebook, viết, nói, đọc, lộ trình 90 ngày, placement */
'use strict';
const LV = window.LV;

/* ================= DỮ LIỆU ================= */
const VOCAB_BASE = {
  en: [
    { id: 'v-en-confident', term: 'confident', pos: 'adjective', ipa: '/ˈkɒn.fɪ.dənt/', meaning: 'tự tin', example: 'I feel more confident when I practise every day.', translation: 'Tôi tự tin hơn khi luyện tập mỗi ngày.', collocations: ['feel confident about sth', 'confident in + noun'], freq: 2, workplace: false, topic: 'Học tập' },
    { id: 'v-en-schedule', term: 'schedule', pos: 'noun / verb', ipa: '/ˈʃed.juːl/', meaning: 'lịch trình', example: 'I have a busy schedule today.', translation: 'Hôm nay tôi có lịch trình bận rộn.', collocations: ['a busy schedule', 'on schedule'], freq: 1, workplace: true, topic: 'Công việc' },
    { id: 'v-en-improve', term: 'improve', pos: 'verb', ipa: '/ɪmˈpruːv/', meaning: 'cải thiện', example: 'Listening every morning will improve your speaking.', translation: 'Nghe mỗi sáng sẽ cải thiện khả năng nói của bạn.', collocations: ['improve at sth', 'improve over time'], freq: 1, workplace: true, topic: 'Học tập' },
    { id: 'v-en-habit', term: 'habit', pos: 'noun', ipa: '/ˈhæb.ɪt/', meaning: 'thói quen', example: 'A small daily habit can create a big change.', translation: 'Một thói quen nhỏ hằng ngày có thể tạo thay đổi lớn.', collocations: ['form a habit', 'a daily habit'], freq: 2, workplace: false, topic: 'Cuộc sống' },
    { id: 'v-en-explain', term: 'explain', pos: 'verb', ipa: '/ɪkˈspleɪn/', meaning: 'giải thích', example: 'Could you explain that idea one more time?', translation: 'Bạn có thể giải thích lại ý đó thêm lần nữa không?', collocations: ['explain sth to sb', 'explain in detail'], freq: 1, workplace: true, topic: 'Giao tiếp' },
    { id: 'v-en-ticket', term: 'ticket', pos: 'noun', ipa: '/ˈtɪk.ɪt/', meaning: 'vé', example: "I'd like a ticket to Hanoi, please.", translation: 'Tôi muốn một vé đi Hà Nội.', collocations: ['a one-way ticket', 'book a ticket'], freq: 2, workplace: false, topic: 'Du lịch' },
    { id: 'v-en-meeting', term: 'meeting', pos: 'noun', ipa: '/ˈmiː.tɪŋ/', meaning: 'cuộc họp', example: "I have a meeting at ten o'clock.", translation: 'Tôi có cuộc họp lúc mười giờ.', collocations: ['attend a meeting', 'a business meeting'], freq: 1, workplace: true, topic: 'Công việc' },
    { id: 'v-en-opinion', term: 'opinion', pos: 'noun', ipa: '/əˈpɪn.jən/', meaning: 'quan điểm', example: 'In my opinion, practice makes perfect.', translation: 'Theo tôi, luyện tập tạo nên sự hoàn hảo.', collocations: ['in my opinion', 'give your opinion'], freq: 2, workplace: true, topic: 'Quan điểm' },
    { id: 'v-en-station', term: 'station', pos: 'noun', ipa: '/ˈsteɪ.ʃən/', meaning: 'nhà ga', example: 'Where is the train station?', translation: 'Ga tàu ở đâu?', collocations: ['train station', 'at the station'], freq: 3, workplace: false, topic: 'Du lịch' },
    { id: 'v-en-ago', term: 'ago', pos: 'adverb', ipa: '/əˈɡəʊ/', meaning: 'trước đây, cách đây', example: 'I started learning Chinese three months ago.', translation: 'Tôi bắt đầu học tiếng Trung ba tháng trước.', collocations: ['two weeks ago', 'long ago'], freq: 1, workplace: false, topic: 'Học tập' }
  ],
  zh: [
    { id: 'v-zh-jianchi', term: '坚持', pinyin: 'jiānchí', meaning: 'kiên trì, duy trì', example: '我每天坚持学习中文。', examplePinyin: 'Wǒ měitiān jiānchí xuéxí Zhōngwén.', translation: 'Tôi kiên trì học tiếng Trung mỗi ngày.', note: 'Cấu trúc: 坚持 + động từ (tiếp tục làm gì).', freq: 1, topic: 'Học tập' },
    { id: 'v-zh-jihua', term: '计划', pinyin: 'jìhuà', meaning: 'kế hoạch', example: '这是我的学习计划。', examplePinyin: 'Zhè shì wǒ de xuéxí jìhuà.', translation: 'Đây là kế hoạch học tập của tôi.', note: 'Có thể là danh từ (kế hoạch) hoặc động từ (lên kế hoạch).', freq: 1, topic: 'Công việc' },
    { id: 'v-zh-lianxi', term: '练习', pinyin: 'liànxí', meaning: 'luyện tập', example: '我想练习说中文。', examplePinyin: 'Wǒ xiǎng liànxí shuō Zhōngwén.', translation: 'Tôi muốn luyện nói tiếng Trung.', note: '练习 + động từ: luyện tập làm gì.', freq: 1, topic: 'Học tập' },
    { id: 'v-zh-mingbai', term: '明白', pinyin: 'míngbai', meaning: 'hiểu, rõ', example: '我明白你的意思。', examplePinyin: 'Wǒ míngbai nǐ de yìsi.', translation: 'Tôi hiểu ý của bạn.', note: 'Tone pair: míng (2) + bai (thanh nhẹ).', freq: 2, topic: 'Giao tiếp' },
    { id: 'v-zh-jieshi', term: '解释', pinyin: 'jiěshì', meaning: 'giải thích', example: '请再解释一次。', examplePinyin: 'Qǐng zài jiěshì yī cì.', translation: 'Làm ơn giải thích thêm một lần.', note: 'Cấu trúc: 解释 + 一下/一次 (giải thích một chút/một lần).', freq: 2, topic: 'Giao tiếp' },
    { id: 'v-zh-jinbu', term: '进步', pinyin: 'jìnbù', meaning: 'tiến bộ', example: '我的中文进步了很多。', examplePinyin: 'Wǒ de Zhōngwén jìnbù le hěnduō.', translation: 'Tiếng Trung của tôi tiến bộ nhiều rồi.', note: '进步 có thể là danh từ hoặc động từ.', freq: 2, topic: 'Học tập' },
    { id: 'v-zh-piao', term: '票', pinyin: 'piào', meaning: 'vé', example: '我要买一张去河内的票。', examplePinyin: 'Wǒ yào mǎi yī zhāng qù Hénèi de piào.', translation: 'Tôi muốn mua một vé đi Hà Nội.', note: 'Measure word: 一张票 (một vé).', freq: 3, topic: 'Du lịch' },
    { id: 'v-zh-huiyi', term: '会议', pinyin: 'huìyì', meaning: 'cuộc họp', example: '我十点有个会议。', examplePinyin: 'Wǒ shí diǎn yǒu ge huìyì.', translation: 'Tôi có cuộc họp lúc mười giờ.', note: 'Cấu trúc: 有 + 个 + 会议 (có một cuộc họp).', freq: 2, topic: 'Công việc' },
    { id: 'v-zh-gaoxing', term: '高兴', pinyin: 'gāoxìng', meaning: 'vui, hạnh phúc', example: '很高兴认识你。', examplePinyin: 'Hěn gāoxìng rènshi nǐ.', translation: 'Rất vui được quen bạn.', note: '很 + tính từ (rất vui); 高兴认识你 = vui được quen bạn.', freq: 1, topic: 'Chào hỏi' },
    { id: 'v-zh-chengwei', term: '成为', pinyin: 'chéngwéi', meaning: 'trở thành', example: '我想成为一名老师。', examplePinyin: 'Wǒ xiǎng chéngwéi yī míng lǎoshī.', translation: 'Tôi muốn trở thành một giáo viên.', note: 'Measure word: 一名老师 (một giáo viên).', freq: 2, topic: 'Công việc' }
  ]
};


const WORKPLACE_PACK = [
  { id: 'w-en-deadline', term: 'deadline', pos: 'noun', ipa: '/ˈded.laɪn/', meaning: 'hạn chót', example: 'The project deadline is next Friday.', translation: 'Hạn chót dự án là thứ Sáu tuần sau.', collocations: ['meet a deadline', 'miss a deadline'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-report', term: 'report', pos: 'noun / verb', ipa: '/rɪˈpɔːt/', meaning: 'báo cáo', example: 'Please send the report by the end of the day.', translation: 'Vui lòng gửi báo cáo trước cuối ngày.', collocations: ['write a report', 'report to sb'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-colleague', term: 'colleague', pos: 'noun', ipa: '/ˈkɒl.iːɡ/', meaning: 'đồng nghiệp', example: 'I often discuss ideas with my colleagues.', translation: 'Tôi thường trao đổi ý tưởng với đồng nghiệp.', collocations: ['a close colleague', 'work with colleagues'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-project', term: 'project', pos: 'noun', ipa: '/ˈprɒdʒ.ekt/', meaning: 'dự án', example: 'We are working on a new project together.', translation: 'Chúng tôi đang cùng làm một dự án mới.', collocations: ['lead a project', 'project deadline'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-manager', term: 'manager', pos: 'noun', ipa: '/ˈmæn.ɪ.dʒər/', meaning: 'quản lý', example: 'My manager will review my work tomorrow.', translation: 'Quản lý của tôi sẽ xem lại công việc của tôi ngày mai.', collocations: ['line manager', 'a project manager'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-client', term: 'client', pos: 'noun', ipa: '/ˈklaɪ.ənt/', meaning: 'khách hàng (của công ty)', example: 'We need to satisfy our clients.', translation: 'Chúng ta cần làm hài lòng khách hàng.', collocations: ['a new client', 'meet a client'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-interview', term: 'interview', pos: 'noun / verb', ipa: '/ˈɪn.tə.vjuː/', meaning: 'phỏng vấn', example: 'I have a job interview on Monday.', translation: 'Tôi có buổi phỏng vấn xin việc vào thứ Hai.', collocations: ['a job interview', 'interview a candidate'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-presentation', term: 'presentation', pos: 'noun', ipa: '/ˌprez.ənˈteɪ.ʃən/', meaning: 'bài thuyết trình', example: 'She gave a clear presentation to the team.', translation: 'Cô ấy thuyết trình rõ ràng trước đội.', collocations: ['give a presentation', 'a short presentation'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-negotiate', term: 'negotiate', pos: 'verb', ipa: '/nɪˈɡəʊ.ʃi.eɪt/', meaning: 'đàm phán', example: 'We need to negotiate the price with the supplier.', translation: 'Chúng ta cần đàm phán giá với nhà cung cấp.', collocations: ['negotiate a contract', 'negotiate with sb'], topic: 'Công việc', freq: 2, workplace: true },
  { id: 'w-en-salary', term: 'salary', pos: 'noun', ipa: '/ˈsæl.ər.i/', meaning: 'lương', example: 'The salary is paid at the end of the month.', translation: 'Lương được trả vào cuối tháng.', collocations: ['a monthly salary', 'salary increase'], topic: 'Công việc', freq: 2, workplace: true },
  { id: 'w-en-feedback', term: 'feedback', pos: 'noun', ipa: '/ˈfiːd.bæk/', meaning: 'phản hồi, góp ý', example: 'Thank you for your honest feedback.', translation: 'Cảm ơn bạn đã góp ý thẳng thắn.', collocations: ['give feedback', 'positive feedback'], topic: 'Công việc', freq: 1, workplace: true },
  { id: 'w-en-task', term: 'task', pos: 'noun', ipa: '/tɑːsk/', meaning: 'nhiệm vụ', example: 'Finish this task before lunch, please.', translation: 'Làm xong nhiệm vụ này trước bữa trưa nhé.', collocations: ['a difficult task', 'complete a task'], topic: 'Công việc', freq: 1, workplace: true }
];

const ROLEPLAY_SCENARIOS = [
  { id: 'restaurant', title: 'At the restaurant', vi: 'Tại nhà hàng — gọi món' },
  { id: 'airport', title: 'At the airport', vi: 'Tại sân bay — làm thủ tục' },
  { id: 'shopping', title: 'Shopping', vi: 'Mua sắm — hỏi giá' },
  { id: 'interview', title: 'Job interview', vi: 'Phỏng vấn xin việc' },
  { id: 'hotel', title: 'At the hotel', vi: 'Tại khách sạn — nhận phòng' },
  { id: 'meeting', title: 'Business meeting', vi: 'Họp công việc' }
];

const READING_TEXTS = {
  en: {
    1: [
      { id: 'r-en-1a', level: 1, title: 'My Morning', paragraphs: [
        'I wake up at six o\u2019clock every morning. First, I brush my teeth and wash my face. Then I have breakfast with my family.',
        'I usually eat bread and drink milk. After breakfast, I go to school by bus. I like the morning because it is quiet and fresh.'
      ], questions: [
        { q: 'What time does the writer wake up?', options: ['At five o\u2019clock', 'At six o\u2019clock', 'At seven o\u2019clock'], answer: 1 },
        { q: 'How does the writer go to school?', options: ['By bus', 'By car', 'On foot'], answer: 0 }
      ] },
      { id: 'r-en-1b', level: 1, title: 'At the Market', paragraphs: [
        'My mother goes to the market every Saturday. She buys vegetables, fruit and fish.',
        'The market is near our house, so she walks there. She talks with the sellers and always comes home with a big smile.'
      ], questions: [
        { q: 'When does the mother go to the market?', options: ['On Sunday', 'On Saturday', 'On Monday'], answer: 1 },
        { q: 'Why does she walk to the market?', options: ['It is far away', 'It is near the house', 'She likes walking in the rain'], answer: 1 }
      ] }
    ],
    2: [
      { id: 'r-en-2a', level: 2, title: 'A Trip to the Coast', paragraphs: [
        'Last summer, my friends and I planned a short trip to the coast. We booked a small hotel near the beach and left early on Saturday morning.',
        'The journey took about three hours. When we arrived, we swam in the sea and played volleyball on the sand. In the evening, we walked along the coast and watched the sunset.',
        'We returned home on Sunday evening, tired but very happy. It was one of the best weekends of the year.'
      ], questions: [
        { q: 'How long was the journey?', options: ['One hour', 'Two hours', 'About three hours'], answer: 2 },
        { q: 'What did they do in the evening?', options: ['Watched a film', 'Walked and watched the sunset', 'Went to a museum'], answer: 1 }
      ] },
      { id: 'r-en-2b', level: 2, title: 'Learning by Doing', paragraphs: [
        'Some people believe that we learn languages best by doing things with them, not just by studying rules. When you order food, ask for directions or talk about your day, the language becomes real.',
        'This is why practice matters more than perfect grammar. A small mistake is not a failure; it is a step forward. The more you speak, the faster you improve.',
        'So find a friend, join a conversation, and start using the words you already know. Progress comes from consistency, not from waiting to feel ready.'
      ], questions: [
        { q: 'What is the main idea of the text?', options: ['Grammar rules are the most important', 'Using the language in real situations helps learning', 'You should wait until you feel ready'], answer: 1 },
        { q: 'According to the text, a small mistake is…', options: ['a failure', 'a reason to stop', 'a step forward'], answer: 2 }
      ] }
    ],
    3: [
      { id: 'r-en-3a', level: 3, title: 'The Power of Small Habits', paragraphs: [
        'We often believe that big results require big actions. In reality, the opposite is true: lasting change usually comes from small habits repeated consistently over time.',
        'Consider language learning. Twenty minutes of focused listening every morning may seem unimportant on any single day. Yet after three months, those minutes become hundreds of hours of meaningful practice that reshape your ability to understand and speak.',
        'The challenge is not knowledge but consistency. Building a habit means choosing a specific time, removing distractions, and forgiving yourself when you miss a day. What matters is not the streak, but returning to the practice again and again.',
        'Start smaller than you think you can manage. A habit you can keep for years will always beat a perfect plan you abandon after a week.'
      ], questions: [
        { q: 'What is the main argument of the text?', options: ['Big actions produce big results', 'Small habits repeated consistently create lasting change', 'Consistency is less important than knowledge'], answer: 1 },
        { q: 'Why does the author mention twenty minutes of listening?', options: ['To show that daily minutes add up over time', 'To recommend a specific app', 'To prove that listening is useless'], answer: 0 },
        { q: 'According to the text, what should you do when you miss a day?', options: ['Give up the habit', 'Double your practice forever', 'Forgive yourself and return to the practice'], answer: 2 }
      ] }
    ]
  },
  zh: {
    1: [
      { id: 'r-zh-1a', level: 1, title: '我的早上', paragraphs: [
        '我每天早上六点起床。我先刷牙洗脸，然后和家人一起吃早饭。',
        '我通常吃面包，喝牛奶。吃完早饭后，我坐公共汽车去学校。我喜欢早上，因为早上很安静。'
      ], questions: [
        { q: '作者每天早上几点起床？', options: ['五点', '六点', '七点'], answer: 1 },
        { q: '作者怎么去学校？', options: ['坐汽车', '坐公共汽车', '走路'], answer: 1 }
      ] },
      { id: 'r-zh-1b', level: 1, title: '在市场', paragraphs: [
        '我妈妈每个星期六去市场。她买蔬菜、水果和鱼。',
        '市场离我们家很近，所以她走路去。她和卖东西的人说话，回家的时候总是很开心。'
      ], questions: [
        { q: '妈妈什么时候去市场？', options: ['星期日', '星期六', '星期一'], answer: 1 },
        { q: '妈妈为什么走路去市场？', options: ['市场很远', '市场很近', '她喜欢走路'], answer: 1 }
      ] }
    ],
    2: [
      { id: 'r-zh-2a', level: 2, title: '海边旅行', paragraphs: [
        '去年夏天，我和朋友们计划了一次去海边的短途旅行。我们订了一家海边的小旅馆，星期六早上很早就出发了。',
        '路上花了大约三个小时。到了以后，我们在海里游泳，在沙滩上打排球。晚上，我们沿着海边散步，看了日落。',
        '星期日晚上我们回到家，虽然很累，但是非常开心。那是今年最好的周末之一。'
      ], questions: [
        { q: '路上花了多长时间？', options: ['一个小时', '两个小时', '大约三个小时'], answer: 2 },
        { q: '晚上他们做了什么？', options: ['看电影', '散步看日落', '去博物馆'], answer: 1 }
      ] }
    ],
    3: [
      { id: 'r-zh-3a', level: 3, title: '小习惯的力量', paragraphs: [
        '我们常常以为，大的结果需要大的行动。其实正好相反：持久的改变通常来自日复一日坚持的小习惯。',
        '拿学语言来说，每天早上专注听二十分钟，单独看哪一天都不算什么。但三个月以后，这些分钟加起来就是几百个小时的有效练习，会真正改变你理解和说话的能力。',
        '困难不在于知识，而在于坚持。养成习惯意味着选一个固定的时间、减少干扰，并且错过一天时原谅自己。重要的不是连续天数，而是不断回到练习中来。',
        '从比你想象中更小的目标开始。一个能坚持多年的习惯，永远胜过坚持一周就放弃的完美计划。'
      ], questions: [
        { q: '文章的主要观点是什么？', options: ['大的行动产生大的结果', '坚持的小习惯带来持久的改变', '坚持不如知识重要'], answer: 1 },
        { q: '为什么提到每天听二十分钟？', options: ['说明每天的时间积累起来很有用', '推荐一个具体的软件', '证明听没有用'], answer: 0 }
      ] }
    ]
  }
};

/* ================= STATE ================= */
const store = {
  get profile() { return load('lv-profile', { displayName: '', goals: [], dailyMinutes: 25, splitEn: 60, ageGroup: 'young-adult', startedAt: null, journeyStartedAt: null, stageHistory: [], placement: {} }); },
  set profile(v) { save('lv-profile', v); },
  get srs() { return load('lv-srs', { items: {} }); },
  set srs(v) { save('lv-srs', v); },
  get mistakes() { return load('lv-mistakes', []); },
  set mistakes(v) { save('lv-mistakes', v); },
  get custom() { return load('lv-custom-vocab', { en: [], zh: [] }); },
  set custom(v) { save('lv-custom-vocab', v); },
  get mined() { return load('lv-mined', { en: [], zh: [] }); },
  set mined(v) { save('lv-mined', v); }
};
function load(key, fallback) { try { return Object.assign(fallback, JSON.parse(localStorage.getItem(key) || 'null')) || fallback; } catch { return fallback; } }
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function localDateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const LEARNER_MODES = {
  preschool: {
    label: '3–6 tuổi', stage: 'Làm quen', primaryAction: 'Cùng chơi và nói',
    teacherPlaceholder: 'Nói hoặc nhờ người lớn nhập giúp…',
    description: 'Nghe, bắt chước và phản xạ bằng hoạt động ngắn có người lớn đồng hành.',
    allowedGoals: ['giao-tiep', 'du-lich']
  },
  child: {
    label: '7–12 tuổi', stage: 'Xây nền', primaryAction: 'Bắt đầu thử thách',
    teacherPlaceholder: 'Hỏi Cô Linh điều bạn chưa hiểu…',
    description: 'Xây phát âm, vốn từ và sự tự tin song song với chương trình ở trường.',
    allowedGoals: ['giao-tiep', 'thi', 'du-lich']
  },
  teen: {
    label: '13–17 tuổi', stage: 'Bứt phá', primaryAction: 'Bắt đầu bài học',
    teacherPlaceholder: 'Nhập câu hỏi cho Cô Linh…',
    description: 'Tăng tốc cho thi cử, giao tiếp thật và định hướng học tập tương lai.',
    allowedGoals: ['giao-tiep', 'thi', 'du-lich', 'cong-viec']
  },
  'young-adult': {
    label: '18–25 tuổi', stage: 'Ứng dụng', primaryAction: 'Bắt đầu ngay',
    teacherPlaceholder: 'Nhập tin nhắn cho cô giáo…',
    description: 'Dùng ngoại ngữ cho đại học, nghề nghiệp, du lịch và hội nhập quốc tế.',
    allowedGoals: ['giao-tiep', 'thi', 'du-lich', 'cong-viec']
  }
};
function normalizeLearnerMode(value) { return Object.hasOwn(LEARNER_MODES, value) ? value : 'young-adult'; }
function selectedLearnerMode(containerId) {
  return normalizeLearnerMode(document.querySelector(`#${containerId} input[type="radio"]:checked`)?.value || store.profile.ageGroup);
}
function applyLearnerMode(value) {
  const mode = normalizeLearnerMode(value);
  const config = LEARNER_MODES[mode];
  document.body.dataset.learnerMode = mode;
  document.querySelectorAll('.age-picker input[type="radio"]').forEach((input) => {
    input.checked = input.value === mode;
  });
  const actionLabel = document.getElementById('planNextGoLabel');
  if (actionLabel) actionLabel.textContent = config.primaryAction;
  const teacherInput = document.getElementById('teacherInput');
  if (teacherInput) teacherInput.placeholder = config.teacherPlaceholder;
  document.querySelectorAll('.stage-goal').forEach((label) => {
    const available = config.allowedGoals.includes(label.dataset.goal);
    label.hidden = !available;
    const input = label.querySelector('input');
    if (input) input.disabled = !available;
  });
  renderJourneyIdentity(mode);
  return mode;
}

function learnerDisplayName() {
  return String(store.profile.displayName || '').trim().slice(0, 40) || 'Bạn';
}

function cleanDisplayName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

function updateJourneyStage(profile, nextMode) {
  const normalized = normalizeLearnerMode(nextMode);
  const today = localDateKey();
  profile.journeyStartedAt = profile.journeyStartedAt || profile.startedAt || today;
  profile.stageHistory = Array.isArray(profile.stageHistory) ? profile.stageHistory : [];
  const latest = profile.stageHistory.at(-1);
  if (!latest || latest.stage !== normalized) {
    profile.stageHistory.push({ stage: normalized, startedAt: today });
    profile.stageHistory = profile.stageHistory.slice(-12);
  }
  profile.ageGroup = normalized;
}

function renderJourneyIdentity(value = store.profile.ageGroup) {
  const mode = normalizeLearnerMode(value);
  const config = LEARNER_MODES[mode];
  const name = learnerDisplayName();
  const nameEl = document.getElementById('journeyProfileName');
  const stageEl = document.getElementById('journeyProfileStage');
  const title = document.getElementById('journeyTitle');
  const description = document.getElementById('journeyDescription');
  if (nameEl) nameEl.textContent = name;
  if (stageEl) stageEl.textContent = `${config.stage} · ${config.label}`;
  if (title) title.textContent = `${name}, đây là chặng ${config.stage.toLocaleLowerCase('vi-VN')}`;
  if (description) description.textContent = `${config.description} Tiến bộ của bạn vẫn được giữ khi chuyển sang giai đoạn tiếp theo.`;
  document.querySelectorAll('#lifeStageRail [data-stage]').forEach((item) => {
    const active = item.dataset.stage === mode;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  });
}
window.applyLearnerMode = applyLearnerMode;

/* ================= SRS ENGINE (SM-2 lite) ================= */
function srsNext(difficulty, grade) {
  const q = Math.max(0, Math.min(1, grade / 5));
  const newDiff = Math.max(0, Math.min(1, difficulty + 0.1 - 0.15 * q));
  let interval = 0;
  if (grade >= 3) interval = grade === 5 ? 30 : grade === 4 ? 10 : 3;
  return { difficulty: newDiff, intervalDays: Math.max(1, Math.round(interval * (1 - newDiff * 0.4))) };
}
function srsState(id, lang) {
  return store.srs.items[lang]?.[id] || { state: 'new', difficulty: 0.3, dueAt: null, lastGrade: null, reps: 0 };
}
function srsRecord(id, lang, grade, kind = 'vocab') {
  const s = store.srs;
  const cur = s.items[lang]?.[id] || { state: 'new', difficulty: 0.3, dueAt: null, lastGrade: null, reps: 0 };
  const next = srsNext(cur.difficulty, grade);
  const passed = grade >= 3;
  let state = cur.state;
  if (!passed) state = 'learning';
  else if (cur.state === 'new' || cur.state === 'learning') state = 'review';
  else if (grade === 5) state = 'mastered';
  const dueAt = passed && next.intervalDays > 0 ? Date.now() + next.intervalDays * 86400000 : null;
  s.items[lang] = s.items[lang] || {};
  s.items[lang][id] = { state, difficulty: next.difficulty, dueAt, lastGrade: grade, reps: cur.reps + 1 };
  store.srs = s;
  // Gamification: gửi lượt làm lên server khi có tài khoản (guest chỉ lưu máy)
  if (window.LVShell) window.LVShell.queueAttempt({ kind, itemRef: id, correct: passed, grade, lang });
  return s.items[lang][id];
}
function dueItems(lang, limit = 10) {
  const s = store.srs.items[lang] || {};
  return Object.entries(s)
    .filter(([id, it]) => findVocab(lang, id) && it.state !== 'mastered' && (it.dueAt === null || it.dueAt <= Date.now())) // bỏ từ mồ côi khỏi đếm/ôn
    .slice(0, limit)
    .map(([id, it]) => ({ id, ...it, item: findVocab(lang, id) }));
}

/* ================= VOCAB ================= */
let extVocab = { en: [], zh: [] }; // dữ liệu chuẩn bị từ data/vocab-{lang}.json
const vocabDataState = {
  en: { status: 'loading', invalid: 0, error: '' },
  zh: { status: 'loading', invalid: 0, error: '' }
};

function dedupeVocab(items, lang) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.term || '').trim().toLocaleLowerCase(lang === 'zh' ? 'zh-CN' : 'en-US');
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

function fallbackVocab(lang) {
  return lang === 'en' ? [...VOCAB_BASE.en, ...WORKPLACE_PACK] : [...VOCAB_BASE.zh];
}

function vocabItems(lang) {
  const prepared = vocabDataState[lang].status === 'ready'
    ? extVocab[lang]
    : vocabDataState[lang].status === 'error' ? fallbackVocab(lang) : [];
  return dedupeVocab([...prepared, ...store.custom[lang]], lang);
}

// Nạp dữ liệu từ vựng đã chuẩn bị (server phục vụ /data/vocab-{lang}.json)
async function initVocabData() {
  for (const lang of ['en', 'zh']) {
    try {
      const res = await fetch(`/data/vocab-${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const items = rawItems.map((it, i) => ({
        ...it,
        id: it.id || `${lang}-ext-${i}`,
        freq: it.freq || 3,
        workplace: Boolean(it.workplace)
      })).filter((it) => it.term && it.meaning && it.example && it.translation);
      extVocab[lang] = dedupeVocab(items, lang);
      vocabDataState[lang] = { status: 'ready', invalid: rawItems.length - items.length, error: '' };
    } catch (error) {
      extVocab[lang] = [];
      vocabDataState[lang] = { status: 'error', invalid: 0, error: String(error?.message || error) };
    }
  }
  // Chỉ render danh sách sau khi đã biết chính xác trạng thái dataset.
  if (!document.getElementById('tab-vocab').hidden) renderVocabAll();
  if (!document.getElementById('tab-reading').hidden) renderReadLibrary();
  renderPlan(); // CEFR + hero stats
}
function findVocab(lang, id) {
  return vocabItems(lang).find((v) => v.id === id) || null;
}
function buildDict(lang) {
  const d = {};
  for (const v of vocabItems(lang)) {
    d[lang === 'zh' ? v.term : v.term.toLowerCase()] = v.meaning;
    if (lang === 'en') d[v.term.toLowerCase() + 's'] = v.meaning; // đơn giản hoá số nhiều
  }
  return d;
}
/* ================= VOCABULARY STUDIO ================= */
const SRS = window.SRS || {};
const LEARN_BATCHES = [3, 5, 7];
const LEARN_BATCH_KEY = 'lv-learn-batch';
function loadLearnBatch() {
  const n = Number(localStorage.getItem(LEARN_BATCH_KEY));
  return LEARN_BATCHES.includes(n) ? n : 5;
}
function saveLearnBatch(n) { try { localStorage.setItem(LEARN_BATCH_KEY, String(n)); } catch {} }
const LEARN_TOPIC_KEY = 'lv-learn-topic'; // gói từ vựng đang chọn ('all' hoặc tên chủ đề)
function loadLearnTopic() { try { return localStorage.getItem(LEARN_TOPIC_KEY) || 'all'; } catch { return 'all'; } }
function saveLearnTopic(t) { try { localStorage.setItem(LEARN_TOPIC_KEY, t); } catch {} }
const vs = { view: 'home', mode: 'review', queue: [], index: 0, revealed: false, records: [], preview: null, steps: [], stepIndex: 0, batchSize: 5, recheckBudget: 0, topic: loadLearnTopic(), currentItem: null };

function vsItemState(lang, id) { return store.srs.items[lang]?.[id] || SRS.initial(); }
function vsSave(lang, id, next) {
  const s = store.srs; s.items[lang] = s.items[lang] || {};
  s.items[lang][id] = { ...vsItemState(lang, id), ...next, lastGrade: next.lastGrade !== undefined ? next.lastGrade : null };
  store.srs = s;
  syncMemory();
}

// aria-live riêng cho studio (không đọc lại toàn trang)
let vsLiveEl = null;
function announceVs(msg) {
  if (!vsLiveEl) { vsLiveEl = document.getElementById('vsLive'); }
  if (!vsLiveEl) { vsLiveEl = document.createElement('div'); vsLiveEl.id = 'vsLive'; vsLiveEl.className = 'sr-only'; vsLiveEl.setAttribute('aria-live', 'polite'); document.body.append(vsLiveEl); }
  vsLiveEl.textContent = msg;
}

function vsHomeStats() {
  const lang = LV.language;
  const items = vocabItems(lang);
  const s = store.srs.items[lang] || {};
  const newCount = items.filter((v) => !s[v.id] || s[v.id].state === 'new').length;
  const due = dueItems(lang, 999).length; // chỉ đếm từ còn tồn tại trong kho
  const freqHigh = items.filter((v) => (v.freq || 3) <= 2).length;
  const workplace = items.filter((v) => v.workplace).length;
  const goalWork = (store.profile.goals || []).includes('cong-viec');
  return { newCount, due, minutes: Math.max(2, Math.round(due * 0.5 + newCount * 0.4)), freqHigh, workplace, goalWork };
}

function vocabCoverage(lang) {
  const state = vocabDataState[lang];
  const source = state.status === 'ready' ? extVocab[lang] : state.status === 'error' ? fallbackVocab(lang) : [];
  const levels = Object.fromEntries(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => [level, 0]));
  source.forEach((item) => { if (levels[item.cefr] !== undefined) levels[item.cefr] += 1; });
  return { ...state, total: source.length, reviewed: source.filter((item) => item.reviewed === true).length, levels };
}

function renderVocabCoverage() {
  const box = document.getElementById('vsDataCoverage');
  if (!box) return;
  box.replaceChildren();
  const coverages = { en: vocabCoverage('en'), zh: vocabCoverage('zh') };
  const isLoading = Object.values(coverages).some((coverage) => coverage.status === 'loading');
  const hasFallback = Object.values(coverages).some((coverage) => coverage.status === 'error');
  const head = document.createElement('div'); head.className = 'vocab-data-head';
  const title = document.createElement('strong'); title.textContent = 'Nguồn dữ liệu đang sử dụng';
  const badge = document.createElement('span'); badge.className = `vocab-data-status ${isLoading ? 'loading' : hasFallback ? 'fallback' : 'ready'}`;
  badge.textContent = isLoading ? 'Đang nạp' : hasFallback ? 'Dữ liệu dự phòng' : 'Đã nạp JSON';
  head.append(title, badge); box.append(head);

  const intro = document.createElement('p');
  intro.textContent = isLoading
    ? 'Đang kiểm tra file dữ liệu trước khi mở danh sách và bài học.'
    : 'Các số dưới đây được tính trực tiếp từ file dữ liệu đang dùng trong ứng dụng.';
  box.append(intro);

  const rows = document.createElement('div'); rows.className = 'vocab-data-rows';
  for (const lang of ['en', 'zh']) {
    const coverage = coverages[lang];
    const row = document.createElement('div'); row.className = 'vocab-data-language';
    const label = document.createElement('strong'); label.textContent = lang === 'en' ? `English · ${coverage.total} từ` : `中文 · ${coverage.total} từ`;
    const detail = document.createElement('span');
    detail.textContent = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => `${level} ${coverage.levels[level]}`).join(' · ');
    row.append(label, detail); rows.append(row);
  }
  box.append(rows);
  if (!isLoading) {
    const note = document.createElement('small');
    const reviewed = coverages.en.reviewed + coverages.zh.reviewed;
    note.textContent = `Coverage hiện chưa đủ mốc A1 và chưa có dữ liệu C1/C2. Human-reviewed: ${reviewed} mục. Mốc CEFR trong Lộ trình chỉ là mục tiêu để tiếp tục xây kho.`;
    box.append(note);
  }

  const currentLoading = vocabDataState[LV.language].status === 'loading';
  ['vsReviewStart', 'vsLearnStart', 'vsReviewQuick', 'vsLearnQuick'].forEach((id) => {
    const button = document.getElementById(id); if (button) button.disabled = currentLoading;
  });
}

function renderStudioHome() {
  renderVocabCoverage();
  const { newCount, due, minutes, freqHigh, workplace, goalWork } = vsHomeStats();
  $('#vsStats').textContent = `${due} từ cần ôn · ${newCount} từ mới · ~${minutes} phút`;
  const freqEl = document.getElementById('vsFreqHint');
  if (freqEl) {
    freqEl.textContent = `Từ phổ biến (tần suất 1–2): ${freqHigh} · Từ giao tiếp công việc: ${workplace}${goalWork ? ' — ưu tiên nhóm công việc.' : ''}`;
  }
  const suggest = $('#vsSuggest');
  suggest.hidden = due > 0;
  suggest.textContent = due === 0
    ? (newCount > 0 ? 'Không có từ cần ôn. Học từ mới hoặc luyện dùng từ đã học nhé!' : 'Thêm từ mới để mở rộng kho từ.')
    : '';
  renderVsReviewList();
  renderVsLearnList();
  renderMistakes();
  renderVsBank();
}

// Thống kê gói theo chủ đề cho một ngôn ngữ: tổng số từ + số từ chưa học
function vsTopicStats(lang) {
  const s = store.srs.items[lang] || {};
  const map = new Map();
  for (const v of vocabItems(lang)) {
    const t = v.topic || 'Khác';
    if (!map.has(t)) map.set(t, { topic: t, total: 0, news: 0 });
    const rec = map.get(t);
    rec.total += 1;
    if (!s[v.id] || s[v.id].state === 'new') rec.news += 1;
  }
  return [...map.values()].sort((a, b) => b.news - a.news || b.total - a.total);
}

// Danh sách từ mới chưa học, lọc theo gói đang chọn, xếp theo mục tiêu (công việc) rồi tần suất
function vsNewWords() {
  const lang = LV.language;
  const s = store.srs.items[lang] || {};
  const topic = vs.topic === 'all' ? null : vs.topic;
  const goalWork = (store.profile.goals || []).includes('cong-viec');
  return vocabItems(lang)
    .filter((v) => (!s[v.id] || s[v.id].state === 'new') && (!topic || v.topic === topic))
    .sort((a, b) => {
      if (goalWork) { const aw = (b.workplace ? 1 : 0) - (a.workplace ? 1 : 0); if (aw) return aw; }
      return (a.freq || 3) - (b.freq || 3); // tần suất phổ biến (freq thấp) học trước
    });
}

function vsBuildQueue(mode) {
  const lang = LV.language;
  if (mode === 'learn') {
    return vsNewWords()
      .slice(0, vs.batchSize)
      .map((v) => ({ id: v.id, item: v }));
  }
  const s = store.srs.items[lang] || {};
  return Object.entries(s)
    .filter(([, it]) => it.state !== 'mastered' && (it.dueAt === null || it.dueAt <= Date.now()))
    .sort((a, b) => (a[1].dueAt || 0) - (b[1].dueAt || 0))
    .slice(0, 10)
    .map(([id]) => ({ id, item: findVocab(lang, id) }))
    .filter((q) => q.item); // từ mồ côi (id không còn trong kho dữ liệu) không được vào phiên
}

// Hiện đúng 1 pane studio (home/brief/session/summary), ẩn phần còn lại
function hideStudioPanes(which) {
  ['home', 'brief', 'session', 'summary'].forEach((k) => {
    const el = document.getElementById('vstudio-' + k);
    if (el) el.hidden = k !== which;
  });
  document.body.classList.toggle('studio-session', which !== 'home');
}

function vsStartSession(mode) {
  if (mode === 'learn') return vsOpenBrief(); // học mới luôn qua briefing: biết rõ số từ trước khi bắt đầu
  vs.mode = mode;
  vs.queue = vsBuildQueue(mode);
  vs.index = 0; vs.revealed = false; vs.records = []; vs.steps = []; vs.stepIndex = 0;
  if (!vs.queue.length) {
    LV.toast('Không có từ cần ôn ngay.');
    return;
  }
  vsPersist();
  hideStudioPanes('session');
  vsShowCard();
}

/* --- Briefing: nói rõ số lượng từ cần học ngay từ đầu --- */
function vsOpenBrief() {
  // Gói đang chọn có thể không tồn tại ở ngôn ngữ vừa đổi — trả về "Tất cả"
  const stats = vsTopicStats(LV.language);
  if (vs.topic !== 'all' && !stats.some((t) => t.topic === vs.topic)) {
    vs.topic = 'all'; saveLearnTopic('all');
  }
  const words = vsNewWords();
  if (!words.length) {
    hideStudioPanes('home');
    renderStudioHome();
    const hint = vs.topic === 'all' ? 'Đã học hết từ mới. Thêm từ để học tiếp!' : `Gói “${vs.topic}” đã học hết từ mới — chọn gói khác hoặc ôn tập nhé!`;
    LV.toast(hint);
    return;
  }
  vs.batchSize = Math.min(loadLearnBatch(), words.length);
  renderVsBrief(words);
  hideStudioPanes('brief');
}

function renderVsBrief(words) {
  const n = Math.min(vs.batchSize, words.length);
  vs.batchSize = n;
  const picked = words.slice(0, n);
  renderVsTopicChips();
  const packLabel = vs.topic === 'all' ? '' : `Gói “${vs.topic}” — `;
  $('#vsBriefCount').textContent = `${n} từ mới`;
  $('#vsBriefDetail').textContent = `${packLabel}mỗi từ kèm 1 câu mẫu · kiểm tra tích lũy xen kẽ ngay trong phiên · ~${Math.max(2, Math.round(n * 0.8))} phút`;
  document.querySelectorAll('#vsBriefBatch button').forEach((b) => {
    const val = Number(b.dataset.batch);
    b.classList.toggle('active', val === n);
    b.setAttribute('aria-pressed', String(val === n));
    b.disabled = val > words.length;
  });
  const list = $('#vsBriefList');
  list.replaceChildren();
  picked.forEach((v, i) => {
    const row = document.createElement('div'); row.className = 'review-item brief-item';
    const ord = document.createElement('b'); ord.className = 'brief-ord'; ord.textContent = String(i + 1).padStart(2, '0');
    const txt = document.createElement('div'); txt.className = 'ri-text';
    const head = document.createElement('b'); head.textContent = v.term;
    const sm = document.createElement('small'); sm.textContent = v.example || '';
    txt.append(head, sm);
    row.append(ord, txt);
    list.append(row);
  });
  $('#vsBriefStart').textContent = `Bắt đầu học ${n} từ mới`;
  announceVs(`Phiên học từ mới: ${n} từ, mỗi từ kèm một câu mẫu.`);
}

// Hàng chip gói trong briefing: "Tất cả" + từng chủ đề kèm số từ mới
function renderVsTopicChips() {
  const stats = vsTopicStats(LV.language);
  const wrap = $('#vsBriefTopic');
  wrap.replaceChildren();
  const mkChip = (topic, label, count, disabled) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.topic = topic;
    b.textContent = count === null ? label : `${label} (${count})`;
    b.setAttribute('aria-pressed', String(vs.topic === topic));
    b.classList.toggle('active', vs.topic === topic);
    if (disabled) b.disabled = true;
    return b;
  };
  wrap.append(mkChip('all', 'Tất cả', stats.reduce((a, t) => a + t.news, 0), false));
  stats.forEach((t) => wrap.append(mkChip(t.topic, t.topic, t.news, t.news === 0)));
}

// --- Packs pane: card từng chủ đề với tiến độ + nút học gói ---
function renderVsPacks() {
  const grid = document.getElementById('vsPackGrid');
  if (!grid) return;
  const lang = LV.language;
  const stats = vsTopicStats(lang);
  grid.replaceChildren();
  if (!stats.length) {
    const p = document.createElement('p'); p.className = 'hint';
    p.textContent = vocabDataState[lang].status === 'loading' ? 'Đang nạp dữ liệu từ vựng…' : 'Chưa có dữ liệu gói từ vựng.';
    grid.append(p); return;
  }
  const mkCard = (name, total, news, topic) => {
    const card = document.createElement('div');
    card.className = 'pack-card' + (vs.topic === topic ? ' active' : '');
    const h = document.createElement('b'); h.textContent = name;
    const meta = document.createElement('span'); meta.className = 'pack-meta';
    meta.textContent = news > 0 ? `${news} từ mới · ${total - news} đã học` : `Đã học hết ${total} từ`;
    const track = document.createElement('div'); track.className = 'pack-track';
    const bar = document.createElement('span');
    bar.style.width = `${total ? Math.round(((total - news) / total) * 100) : 0}%`;
    track.append(bar);
    const actions = document.createElement('div'); actions.className = 'hero-actions pack-actions';
    if (news > 0) {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn primary sm';
      btn.textContent = 'Học gói này';
      btn.addEventListener('click', () => { vs.topic = topic; saveLearnTopic(topic); vsOpenBrief(); });
      actions.append(btn);
    } else {
      const done = document.createElement('span'); done.className = 'pack-done';
      done.textContent = '✓ Hoàn thành — ôn tập để giữ nhớ';
      actions.append(done);
    }
    card.append(h, meta, track, actions);
    return card;
  };
  grid.append(mkCard('Tất cả chủ đề', stats.reduce((a, t) => a + t.total, 0), stats.reduce((a, t) => a + t.news, 0), 'all'));
  stats.forEach((t) => grid.append(mkCard(t.topic, t.total, t.news, t.topic)));
}

function vsBriefBegin() {
  const words = vsNewWords().slice(0, Math.max(1, vs.batchSize));
  if (!words.length) { LV.toast('Không còn từ mới để học.'); vsCloseBrief(); return; }
  vs.mode = 'learn';
  vs.queue = words.map((v) => ({ id: v.id, item: v }));
  // Kỹ thuật tích lũy: xen kẽ giới thiệu từ mới với kiểm tra từ đã học trong chính phiên
  vs.steps = SRS.buildLearnSteps ? SRS.buildLearnSteps(vs.queue.map((q) => q.id)) : vs.queue.map((q) => ({ t: 'learn', id: q.id }));
  vs.stepIndex = 0; vs.index = 0; vs.revealed = false; vs.records = []; vs.recheckBudget = 3;
  vsPersist();
  hideStudioPanes('session');
  vsShowStep();
}

function vsCloseBrief() {
  hideStudioPanes('home');
  renderStudioHome();
}

// Lưu trạng thái phiên để "tiếp tục bài đang dở" (giữ khi thoát, xoá khi hoàn thành)
function vsPersist() {
  try {
    const payload = { mode: vs.mode, ids: vs.queue.map((q) => q.id), index: vs.index, records: vs.records.map((r) => ({ id: r.id, grade: r.grade })) };
    if (vs.mode === 'learn') { payload.steps = vs.steps; payload.stepIndex = vs.stepIndex; } // bước tích lũy để resume đúng chỗ
    localStorage.setItem('lv-session', JSON.stringify(payload));
  } catch {}
}
function vsClearSession() {
  try { localStorage.removeItem('lv-session'); } catch {}
}
function hasUnfinishedSession() {
  try {
    const raw = localStorage.getItem('lv-session');
    if (!raw) return false;
    const s = JSON.parse(raw);
    return Array.isArray(s.ids) && s.ids.length > 0; // phiên rỗng không tính là đang dở
  } catch { return false; }
}
function resumeSession() {
  let raw = null;
  try { raw = localStorage.getItem('lv-session'); } catch {}
  if (!raw) { LV.toast('Không có bài đang dở.'); return; }
  try {
    const s = JSON.parse(raw);
    const lang = LV.language;
    const queue = (s.ids || []).map((id) => ({ id, item: findVocab(lang, id) })).filter((x) => x.item);
    if (!queue.length) { vsClearSession(); LV.toast('Bài đang dở đã hết hiệu lực.'); return; }
    vs.queue = queue;
    vs.revealed = false;
    vs.records = (s.records || []).map((r) => ({ id: r.id, grade: r.grade, item: findVocab(lang, r.id) })).filter((r) => r.item);
    vs.mode = s.mode === 'review' ? 'review' : 'learn';
    if (vs.mode === 'learn') {
      // Phiên mới lưu steps (learn/check tích lũy); phiên cũ không có -> mỗi từ 1 lượt đoán như trước
      vs.steps = Array.isArray(s.steps) && s.steps.length
        ? s.steps.filter((st) => st && queue.some((q) => q.id === st.id))
        : queue.map((q) => ({ t: 'check', id: q.id }));
      if (!vs.steps.length) { vsClearSession(); LV.toast('Bài đang dở đã hết hiệu lực.'); return; }
      vs.stepIndex = Math.min(Number(s.stepIndex) || 0, vs.steps.length - 1);
      vs.index = 0;
      hideStudioPanes('session');
      vsShowStep();
      LV.toast(`Tiếp tục học mới — đã học ${learnedCount()}/${queue.length} từ.`);
    } else {
      vs.index = Math.min(Number(s.index) || 0, queue.length - 1);
      hideStudioPanes('session');
      vsShowCard();
      LV.toast(`Tiếp tục ôn tập từ ${vs.index + 1}/${queue.length}.`);
    }
  } catch { vsClearSession(); }
}
function vsStartReview() { vsStartSession('review'); }
function vsStartLearn() { vsStartSession('learn'); }
function startLearn() { vsStartSession('learn'); }

/* --- Bước phiên học mới (tích lũy): learn = giới thiệu từ mới, check = kiểm tra từ đã học --- */
function vsStep() { return vs.steps[vs.stepIndex]; }
function learnedCount() { return vs.steps.slice(0, vs.stepIndex + 1).filter((st) => st.t === 'learn').length; }
// Item đang hiển thị: phiên learn đi theo bước, phiên ôn tập đi theo index
function vsCurrentItem() {
  if (vs.mode === 'learn') { const step = vsStep(); return step ? vs.queue.find((q) => q.id === step.id) || null : null; }
  return vs.queue[vs.index] || null;
}

function vsShowStep() {
  const step = vsStep();
  if (!step) return vsFinish();
  const cur = vs.queue.find((q) => q.id === step.id);
  if (!cur) { vs.stepIndex += 1; return vsShowStep(); } // từ không còn trong kho — bỏ qua bước
  const total = vs.queue.length;
  const done = learnedCount();
  const badge = $('#vsStepBadge');
  badge.hidden = false;
  if (step.t === 'learn') {
    badge.textContent = `Từ mới ${done}/${total}`;
    badge.classList.remove('check');
    return vsShowLearnCard(cur.item, done, total);
  }
  badge.textContent = `Kiểm tra tích lũy · đã học ${done}/${total} từ`;
  badge.classList.add('check');
  vsShowCard();
}

// Thẻ giới thiệu từ mới: hiện ngay nghĩa + câu mẫu (không đoán) — làm quen từ trước khi bị kiểm tra
function vsShowLearnCard(v, done, total) {
  vs.currentItem = v;
  const isZh = LV.language === 'zh';
  $('#vsTopic').textContent = v.topic || '';
  $('#vsTerm').textContent = v.term;
  const py = $('#vsPinyin');
  if (isZh && v.pinyin) { py.textContent = v.pinyin; py.hidden = false; } else { py.textContent = ''; py.hidden = true; }
  vsRenderBack(v);
  $('#vsInterval').textContent = '';
  $('#vsBack').hidden = false;
  $('#vsReveal').hidden = true;
  $('#vsGrades').hidden = true;
  $('#vsUnderstood').hidden = false;
  $('#vsProgressText').textContent = `${done}/${total} từ mới`;
  $('#vsProgressBar').style.width = `${(vs.stepIndex / Math.max(1, vs.steps.length)) * 100}%`;
  vsPronReset(v); // luyện đọc/nói ngay trên thẻ giới thiệu
  announceVs(`Từ mới ${done} trên ${total}: ${v.term}. Nghĩa: ${v.meaning}. Câu mẫu: ${v.example || ''}`);
}

function vsUnderstood() {
  const step = vsStep();
  if (!step || step.t !== 'learn') return;
  // Đã giới thiệu xong: sang learning và đến hạn ôn ngay để tham gia kiểm tra tích lũy trong phiên
  vsSave(LV.language, step.id, { ...SRS.initial(), state: 'learning', dueAt: Date.now() });
  vsAdvance(250);
}

function vsAdvance(delay = 450) {
  setTimeout(() => {
    vs.stepIndex += 1;
    if (vs.stepIndex >= vs.steps.length) vsFinish();
    else { vsPersist(); vsShowStep(); }
  }, delay);
}

function vsShowCard() {
  const cur = vs.mode === 'learn' ? vs.queue.find((q) => q.id === vsStep().id) : vs.queue[vs.index];
  if (!cur || !cur.item) return; // không bao giờ render thẻ trống
  vs.revealed = false;
  const v = cur.item;
  vs.currentItem = v;
  const isZh = LV.language === 'zh';
  $('#vsTopic').textContent = v.topic || '';
  $('#vsTerm').textContent = v.term;
  const py = $('#vsPinyin');
  if (isZh && v.pinyin) { py.textContent = v.pinyin; py.hidden = false; } else { py.textContent = ''; py.hidden = true; }
  $('#vsUnderstood').hidden = true;
  $('#vsBack').hidden = true;
  $('#vsReveal').hidden = false;
  $('#vsGrades').hidden = true;
  if (vs.mode === 'learn') {
    $('#vsProgressText').textContent = `${learnedCount()}/${vs.queue.length} từ mới`;
    $('#vsProgressBar').style.width = `${(vs.stepIndex / Math.max(1, vs.steps.length)) * 100}%`;
  } else {
    $('#vsProgressText').textContent = `${vs.index + 1} / ${vs.queue.length}`;
    $('#vsProgressBar').style.width = `${(vs.index / vs.queue.length) * 100}%`;
  }
  announceVs(vs.mode === 'learn' ? `Kiểm tra tích lũy: ${v.term}` : `Từ ${vs.index + 1} trên ${vs.queue.length}: ${v.term}`);
}

function vsRenderBack(v) {
  const isZh = LV.language === 'zh';
  const posIpa = document.getElementById('vsPosIpa');
  posIpa.textContent = isZh ? (v.pinyin ? `Pinyin: ${v.pinyin}` : '') : [v.pos, v.ipa].filter(Boolean).join(' · ');
  posIpa.hidden = !posIpa.textContent;
  $('#vsMeaning').textContent = v.meaning;
  $('#vsExample').textContent = v.example;
  const ep = document.getElementById('vsExamplePinyin');
  if (isZh && v.examplePinyin) { ep.textContent = v.examplePinyin; ep.hidden = false; } else { ep.textContent = ''; ep.hidden = true; }
  $('#vsTranslation').textContent = v.translation;
  const note = document.getElementById('vsNote');
  if (isZh && v.note) { note.textContent = `Ghi chú: ${v.note}`; note.hidden = false; }
  else if (!isZh && v.collocations && v.collocations.length) { note.textContent = `Cách dùng: ${v.collocations.join(' · ')}`; note.hidden = false; }
  else { note.textContent = ''; note.hidden = true; }
  const meta = document.getElementById('vsMeta');
  if (meta) {
    const chips = [];
    if (v.freq) chips.push(`Tần suất ${v.freq}/5`);
    if (v.workplace) chips.push('Giao tiếp công việc');
    meta.textContent = chips.join(' · ');
    meta.hidden = !chips.length;
  }
}

function vsReveal() {
  if (vs.mode === 'learn') {
    const step = vsStep();
    if (!step) return;
    if (step.t === 'learn') return vsUnderstood(); // Space trên thẻ giới thiệu = đã hiểu
  }
  const cur = vs.mode === 'learn' ? vs.queue.find((q) => q.id === vsStep()?.id) : vs.queue[vs.index];
  if (vs.revealed || !cur || !cur.item) return;
  vs.revealed = true;
  vsRenderBack(cur.item);
  vsPronReset(cur.item); // sau khi lật đáp án cũng có thể luyện đọc/nói
  $('#vsBack').hidden = false;
  $('#vsReveal').hidden = true;
  $('#vsGrades').hidden = false;
  $('#vsInterval').textContent = '';
  announceVs(`Đáp án: ${cur.item.meaning}`);
}

function vsGrade(grade) {
  if (!vs.revealed) return;
  const cur = vs.mode === 'learn' ? vs.queue.find((q) => q.id === vsStep()?.id) : vs.queue[vs.index];
  if (!cur) return;
  const lang = LV.language;
  const next = SRS.evaluate(vsItemState(lang, cur.id), grade);
  next.lastGrade = grade;
  vsSave(lang, cur.id, next);
  vs.records.push({ id: cur.id, grade, item: cur.item });
  if (window.LVShell) window.LVShell.queueAttempt({ kind: 'vocab', itemRef: cur.id, correct: grade >= 3, grade, lang });
  const label = SRS.GRADE_LABELS[grade] || grade;
  $('#vsInterval').textContent = `Đã ghi nhận: ${label} — ôn lại sau ${SRS.intervalLabel(next.intervalMs)}`;
  announceVs(`${label} — ôn lại sau ${SRS.intervalLabel(next.intervalMs)}`);
  // Tích lũy: quên trong phiên (Lại) -> xếp thêm 1 lần kiểm tra cuối phiên (ngân sách giới hạn để phiên không kéo vô hạn)
  if (vs.mode === 'learn' && grade <= 1 && vs.recheckBudget > 0) {
    vs.steps.push({ t: 'check', id: cur.id });
    vs.recheckBudget -= 1;
  }
  if (vs.mode === 'learn') vsAdvance();
  else setTimeout(() => {
    vs.index += 1;
    if (vs.index >= vs.queue.length) vsFinish();
    else { vsPersist(); vsShowCard(); }
  }, 450);
}

function vsFinish() {
  vsClearSession();
  const sum = SRS.summarize(vs.records);
  if (vs.mode === 'learn') {
    const learned = vs.queue.length;
    const checks = vs.records.length;
    recordActivity(Math.max(2, Math.round(learned * 0.7 + checks * 0.3)), learned);
    renderVsSummary(learned, checks, sum.again);
    hideStudioPanes('summary');
    LV.toast(`Học xong ${learned} từ mới · ${checks} lần kiểm tra tích lũy · ${sum.again} lần cần học lại.`);
    announceVs(`Kết thúc phiên: học ${learned} từ mới, ${checks} lần kiểm tra tích lũy, ${sum.again} lần cần học lại.`);
  } else {
    recordActivity(vs.records.length, vs.records.length); // ~1 phút/từ
    hideStudioPanes('home');
    renderStudioHome();
    LV.toast(`Phiên xong: ôn ${sum.total}, nhớ tốt ${sum.good}, cần học lại ${sum.again}.`);
    announceVs(`Kết thúc phiên: ${sum.total} từ, nhớ tốt ${sum.good}, cần học lại ${sum.again}.`);
  }
}

function renderVsSummary(learned, checks, again) {
  $('#vsSumTitle').textContent = `Học xong ${learned} từ mới`;
  $('#vsSumWords').textContent = String(learned);
  $('#vsSumChecks').textContent = String(checks);
  $('#vsSumAgain').textContent = String(again);
  $('#vsSumNote').textContent = again > 0
    ? `${again} lần quên — các từ này đã được kiểm tra lại trong phiên và có trong lịch SRS để ôn tiếp.`
    : 'Mọi từ đều nhớ tốt — lịch SRS sẽ nhắc bạn ôn lại đúng thời điểm.';
}

function vsExit() {
  if (vs.queue.length) vsPersist(); // chỉ giữ lại phiên khi thực sự có nội dung đang dở
  else vsClearSession();
  hideStudioPanes('home');
  renderStudioHome();
}

// --- Studio Home: danh sách Ôn tập / Học mới ---
function renderVsReviewList() {
  const lang = LV.language;
  const list = document.getElementById('vsReviewList');
  list.replaceChildren();
  const items = dueItems(lang, 6);
  if (!items.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'Không có từ cần ôn ngay.'; list.append(p); return; }
  items.forEach((it) => {
    const row = document.createElement('div'); row.className = 'review-item vs-bank-item';
    const txt = document.createElement('div'); txt.className = 'ri-text';
    const b = document.createElement('b'); b.textContent = it.item ? `${it.item.term} — ${it.item.meaning}` : it.id;
    txt.append(b);
    row.append(txt);
    list.append(row);
  });
}
function renderVsLearnList() {
  const lang = LV.language;
  const s = store.srs.items[lang] || {};
  const list = document.getElementById('vsLearnList');
  list.replaceChildren();
  const news = vocabItems(lang).filter((v) => !s[v.id] || s[v.id].state === 'new').slice(0, 6);
  if (!news.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'Không còn từ mới.'; list.append(p); return; }
  news.forEach((v) => {
    const row = document.createElement('div'); row.className = 'review-item';
    const txt = document.createElement('div'); txt.className = 'ri-text';
    const b = document.createElement('b'); b.textContent = `${v.term} — ${v.meaning}`;
    txt.append(b);
    row.append(txt);
    list.append(row);
  });
}

// --- Mistakes (giữ nguyên, dùng chung error notebook) ---
function renderMistakes() {
  const list = $('#mistakeList');
  const items = store.mistakes.filter((m) => m.lang === LV.language);
  list.replaceChildren();
  if (!items.length) {
    const li = document.createElement('li'); li.textContent = 'Chưa có lỗi nào được ghi lại.'; li.className = 'hint';
    list.append(li); return;
  }
  for (const m of items) {
    const li = document.createElement('li'); li.className = m.status === 'done' ? 'done' : '';
    const head = document.createElement('b'); head.textContent = `[${skillLabel(m.skill)}] ${m.pattern}`;
    const detail = document.createElement('small'); detail.textContent = m.correct ? `Sửa đúng: ${m.correct}` : '';
    const mark = document.createElement('button'); mark.type = 'button'; mark.className = 'chip'; mark.style.cssFloat = 'right';
    mark.textContent = m.status === 'done' ? 'Hoàn tất' : 'Đã sửa';
    mark.addEventListener('click', () => { m.status = 'done'; store.mistakes = [...store.mistakes]; renderMistakes(); });
    li.append(head, mark, detail);
    list.append(li);
  }
}
function addMistake(skill, pattern, correct) {
  const lang = LV.language;
  store.mistakes = [...store.mistakes, { id: `m-${Date.now()}`, lang, skill, pattern: String(pattern).slice(0, 160), correct: String(correct || '').slice(0, 160), status: 'new', at: Date.now() }];
  syncMemory();
}

// --- Word Bank ---
function vsBankItems() {
  const langF = document.getElementById('vsLangFilter').value;
  const langs = langF === 'all' ? ['en', 'zh'] : [langF];
  const out = [];
  for (const lang of langs) {
    for (const v of vocabItems(lang)) out.push({ ...v, lang, state: vsItemState(lang, v.id) });
  }
  return out;
}
function vsFillTopicFilter() {
  const sel = document.getElementById('vsTopicFilter');
  const topics = new Set();
  vsBankItems().forEach((i) => i.topic && topics.add(i.topic));
  sel.replaceChildren();
  const all = document.createElement('option'); all.value = 'all'; all.textContent = 'Mọi chủ đề'; sel.append(all);
  [...topics].sort().forEach((t) => { const o = document.createElement('option'); o.value = t; o.textContent = t; sel.append(o); });
}
function renderVsBank() {
  const q = (document.getElementById('vsSearch').value || '').trim().toLowerCase();
  const topic = document.getElementById('vsTopicFilter').value;
  const cefrF = document.getElementById('vsCefrFilter') ? document.getElementById('vsCefrFilter').value : 'all';
  const state = document.getElementById('vsStateFilter').value;
  const freqF = document.getElementById('vsFreqFilter') ? document.getElementById('vsFreqFilter').value : 'all';
  const workF = document.getElementById('vsWorkFilter') ? document.getElementById('vsWorkFilter').value : 'all';
  const list = document.getElementById('vsBankList');
  list.replaceChildren();
  let items = vsBankItems();
  if (q) items = items.filter((i) => (i.term || '').toLowerCase().includes(q) || (i.meaning || '').toLowerCase().includes(q));
  if (topic !== 'all') items = items.filter((i) => i.topic === topic);
  if (cefrF !== 'all') items = items.filter((i) => i.cefr === cefrF);
  if (state !== 'all') items = items.filter((i) => (state === 'difficult' ? i.state.difficult : i.state.state === state));
  if (freqF !== 'all') items = items.filter((i) => (i.freq || 3) === Number(freqF));
  if (workF !== 'all') items = items.filter((i) => (workF === 'yes' ? Boolean(i.workplace) : !i.workplace));
  items.sort((a, b) => {
    if (a.workplace !== b.workplace) return a.workplace ? -1 : 1; // công việc lên trước
    return (a.freq || 3) - (b.freq || 3) || (a.term || '').localeCompare(b.term || '');
  });
  const count = document.getElementById('vsBankCount');
  if (count) count.textContent = `Tìm thấy ${items.length} mục · đang hiển thị ${Math.min(items.length, 60)}`;
  if (!items.length) {
    const p = document.createElement('p'); p.className = 'hint';
    p.textContent = vocabDataState.en.status === 'loading' || vocabDataState.zh.status === 'loading'
      ? 'Đang nạp dữ liệu từ vựng…' : 'Không tìm thấy từ nào với bộ lọc hiện tại.';
    list.append(p); return;
  }
  items.slice(0, 60).forEach((i) => {
    const row = document.createElement('button'); row.type = 'button'; row.className = 'review-item vs-bank-item';
    const txt = document.createElement('div'); txt.className = 'ri-text';
    const b = document.createElement('b'); b.textContent = `${i.lang === 'zh' ? '中文' : 'EN'} · ${i.term} — ${i.meaning}`;
    const small = document.createElement('small'); small.textContent = `${i.cefr || 'Chưa gắn CEFR'} · ${i.example || ''}`;
    txt.append(b, small);
    const st = document.createElement('span'); st.className = 'bank-state ' + (i.state.difficult ? 'difficult' : i.state.state); st.textContent = i.state.state;
    row.append(txt, st);
    row.addEventListener('click', () => vsOpenDetail(i));
    list.append(row);
  });
}
// Nhấn giữ ~0,45s trên từ/câu mẫu để mở chi tiết: nghĩa + cách dùng + nghe + đọc thử.
// Di chuyển quá 10px hoặc nhả tay là hủy; sau khi kích hoạt sẽ chặn click ngay sau đó.
function vsBindLongPress(el, getItem) {
  let timer = null, sx = 0, sy = 0, fired = false;
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  el.classList.add('holdable');
  el.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    fired = false;
    sx = e.clientX; sy = e.clientY;
    cancel();
    timer = setTimeout(() => {
      timer = null;
      fired = true;
      if (navigator.vibrate) navigator.vibrate(15);
      const item = getItem();
      if (item) vsOpenDetail(item);
    }, 450);
  });
  el.addEventListener('pointermove', (e) => {
    if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) cancel();
  });
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('click', (e) => {
    if (!fired) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    fired = false;
  });
  // giữ lâu trên mobile không được mở menu hệ thống / chọn chữ
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Khối "Đọc thử" trong popup chi tiết từ: đọc từ, so từng từ + AI mẹo sửa + nghe lại giọng mình
function vsDetailPronBlock(item) {
  const lang = item.lang || LV.language;
  const box = document.createElement('div'); box.className = 'vs-detail-pron';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn ghost sm';
  btn.setAttribute('aria-pressed', 'false'); btn.textContent = 'Đọc thử';
  const status = document.createElement('p'); status.className = 'hint'; status.setAttribute('role', 'status');
  const result = document.createElement('div'); result.hidden = true;
  const words = document.createElement('div'); words.className = 'pron-words';
  words.setAttribute('aria-label', 'So từng từ với từ mục tiêu');
  const score = document.createElement('p'); score.className = 'vs-pron-score';
  const scoreText = document.createElement('strong'); scoreText.setAttribute('aria-live', 'polite');
  score.appendChild(scoreText);
  const fb = document.createElement('div');
  const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'btn ghost sm';
  replay.setAttribute('aria-label', 'Nghe lại giọng bạn vừa đọc'); replay.hidden = true; replay.textContent = 'Nghe lại';
  result.append(words, score, fb, replay);
  box.append(btn, status, result);
  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.setAttribute('aria-pressed', 'true');
    result.hidden = true;
    fb.replaceChildren();
    words.replaceChildren();
    status.textContent = 'Đang nghe bạn đọc…';
    const recOn = await LV.selfRecord.start();
    const heard = await LV.listenOnce({
      language: LV.SPEECH_LANG[lang],
      timeoutMs: 10000,
      onListening: () => { status.textContent = 'Đang nghe bạn đọc…'; },
      onProcessing: () => { status.textContent = 'Đang nhận dạng…'; },
      onError: () => { status.textContent = 'Không nghe rõ — thử lại ở nơi yên tĩnh nhé.'; }
    });
    const myVoice = recOn ? await LV.selfRecord.stop() : '';
    pronReplayInto(replay, myVoice);
    btn.disabled = false;
    btn.setAttribute('aria-pressed', 'false');
    if (!heard) return;
    const aligned = window.Pron.align(item.term, heard, lang);
    const scoreNum = window.Pron.score(aligned);
    pronRenderDiffInto(words, aligned);
    result.hidden = false;
    scoreText.textContent = `${scoreNum}/100 — ${pronScoreLabel(scoreNum)}`;
    status.textContent = `Bạn đọc: “${heard}”`;
    if (scoreNum < 90) addMistake('speaking', `Phát âm: “${item.term}”`, item.term);
    renderMistakes();
    if (scoreNum >= 100) return;
    fb.replaceChildren();
    const loading = document.createElement('p');
    loading.className = 'hint';
    loading.textContent = 'Cô Linh đang nghe cách bạn đọc…';
    fb.appendChild(loading);
    const level = store.profile.placement?.[lang]?.level || 2;
    try {
      const res = await fetch('/api/pronunciation/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: item.term, heard, language: lang, level })
      });
      const d = await res.json();
      fb.replaceChildren();
      if (!res.ok) {
        const p = document.createElement('p');
        p.className = 'hint';
        p.textContent = d.code === 'NO_AI'
          ? 'Chưa cấu hình AI nên chưa có mẹo chi tiết — so từng từ phía trên vẫn dùng được.'
          : 'Chưa phân tích được lúc này — bạn vẫn xem được so từng từ phía trên.';
        fb.appendChild(p);
        return;
      }
      scoreText.textContent = `${d.score}/100 — ${d.praise}`;
      pronFeedbackInto(fb, d);
    } catch {
      fb.replaceChildren();
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Mất kết nối tới AI — bạn vẫn xem được so từng từ phía trên.';
      fb.appendChild(p);
    }
  });
  return box;
}

function vsOpenDetail(item) {
  const body = document.getElementById('vsDetailBody');
  body.replaceChildren();
  const isZh = item.lang === 'zh';
  const h = document.createElement('h3'); h.textContent = item.term;
  const py = document.createElement('p'); py.className = 'vocab-pinyin'; py.textContent = isZh ? (item.pinyin || '') : [item.pos, item.ipa].filter(Boolean).join(' · ');
  const me = document.createElement('p'); me.className = 'vs-meaning'; me.textContent = item.meaning;
  const ex = document.createElement('p'); ex.className = 'vs-example'; ex.textContent = item.example;
  const tr = document.createElement('p'); tr.className = 'vocab-trans'; tr.textContent = item.translation;
  const note = document.createElement('p'); note.className = 'vs-note'; note.textContent = isZh ? (item.note || '') : (item.collocations && item.collocations.length ? `Cách dùng: ${item.collocations.join(' · ')}` : '');
  note.hidden = !note.textContent;
  const audio = document.createElement('div'); audio.className = 'hero-actions';
  const b0 = document.createElement('button'); b0.type = 'button'; b0.className = 'btn ghost sm'; b0.textContent = 'Nghe từ';
  b0.onclick = () => LV.playText(item.term, item.lang, { announceFallback: false });
  const b1 = document.createElement('button'); b1.type = 'button'; b1.className = 'btn ghost sm'; b1.textContent = 'Nghe câu';
  b1.onclick = () => LV.playText(item.example, item.lang, { announceFallback: false });
  const b2 = document.createElement('button'); b2.type = 'button'; b2.className = 'btn ghost sm'; b2.textContent = 'Nghe câu chậm';
  b2.onclick = () => LV.playText(item.example, item.lang, { speed: 0.75, announceFallback: false });
  audio.append(b0, b1, b2);
  body.append(h, py, me, ex, tr, note, audio);
  body.append(vsDetailPronBlock(item)); // đọc thử ngay trong popup
  if (item.id && item.id.startsWith('c-')) {
    const del = document.createElement('button'); del.type = 'button'; del.className = 'btn ghost sm'; del.textContent = 'Xóa khỏi kho';
    del.onclick = () => {
      const c = store.custom; c[item.lang] = c[item.lang].filter((x) => x.id !== item.id); store.custom = c;
      closeModal(document.getElementById('vsDetail'));
      vsFillTopicFilter(); renderVsBank(); syncMemory();
    };
    body.append(del);
  }
  openModal(document.getElementById('vsDetail'), '#vsDetailClose');
}

// --- AI tạo thẻ: preview/edit trước khi lưu + cảnh báo trùng ---
async function vsAddWord() {
  const input = document.getElementById('vsAddInput');
  const term = input.value.trim();
  if (!term) return LV.toast('Nhập từ/cụm muốn thêm.');
  const status = document.getElementById('vsAddStatus');
  const lang = LV.language;
  const dup = vocabItems(lang).find((v) => (v.term || '').toLowerCase() === term.toLowerCase());
  if (dup) { status.textContent = `Cảnh báo: “${term}” đã có trong kho từ (${dup.meaning}).`; return; }
  status.textContent = 'AI đang tạo thẻ…';
  try {
    const res = await fetch('/api/vocab/card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ term, language: lang }) });
    const data = await res.json();
    if (!res.ok) { status.textContent = data.code === 'NO_AI' ? 'Cần key AI để tạo thẻ.' : 'Không tạo được thẻ.'; return; }
    vs.preview = { ...data, lang };
    renderVsPreview();
  } catch { status.textContent = 'Lỗi kết nối.'; }
}
function renderVsPreview() {
  const box = document.getElementById('vsAddPreview');
  if (!vs.preview) { box.hidden = true; box.replaceChildren(); return; }
  box.hidden = false; box.replaceChildren();
  const isZh = vs.preview.lang === 'zh';
  const title = document.createElement('b'); title.textContent = `Xem trước thẻ: ${vs.preview.term}`;
  box.append(title);
  const fields = isZh ? ['meaning', 'pinyin', 'example', 'translation', 'note', 'topic'] : ['meaning', 'pos', 'ipa', 'example', 'translation', 'collocations', 'topic'];
  fields.forEach((k) => {
    const label = document.createElement('label'); label.textContent = k;
    const ta = document.createElement('textarea'); ta.value = Array.isArray(vs.preview[k]) ? vs.preview[k].join(' | ') : (vs.preview[k] || ''); ta.dataset.field = k;
    box.append(label, ta);
  });
  const actions = document.createElement('div'); actions.className = 'hero-actions';
  const save = document.createElement('button'); save.type = 'button'; save.className = 'btn primary sm'; save.textContent = 'Lưu thẻ';
  save.onclick = vsSavePreview;
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn ghost sm'; cancel.textContent = 'Hủy';
  cancel.onclick = () => { vs.preview = null; renderVsPreview(); };
  actions.append(save, cancel);
  box.append(actions);
}
function vsSavePreview() {
  if (!vs.preview) return;
  const box = document.getElementById('vsAddPreview');
  const read = (k) => { const ta = box.querySelector(`textarea[data-field="${k}"]`); return ta ? ta.value.trim() : ''; };
  const lang = vs.preview.lang;
  const entry = { id: `c-${lang}-${Date.now()}`, term: vs.preview.term };
  const isZh = lang === 'zh';
  (isZh ? ['meaning', 'pinyin', 'example', 'translation', 'note', 'topic'] : ['meaning', 'pos', 'ipa', 'example', 'translation', 'topic']).forEach((k) => { entry[k] = read(k); });
  if (!isZh) entry.collocations = read('collocations').split('|').map((s) => s.trim()).filter(Boolean).slice(0, 2);
  if (!entry.meaning || !entry.example) return LV.toast('Cần ít nhất nghĩa và câu ví dụ.');
  const c = store.custom; c[lang].push(entry); store.custom = c;
  vs.preview = null; renderVsPreview();
  document.getElementById('vsAddInput').value = '';
  document.getElementById('vsAddStatus').textContent = 'Đã lưu thẻ từ mới.';
  vsFillTopicFilter(); renderVsBank(); syncMemory();
}

function renderVocabAll() {
  vsFillTopicFilter();
  renderStudioHome();
  renderVsPacks();
}

function vsShowView(view) {
  vs.view = view;
  document.querySelectorAll('#studioTabs button').forEach((b) => {
    const on = b.dataset.vview === view;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  ['review', 'learn', 'packs', 'bank', 'mistakes'].forEach((v) => {
    document.getElementById('vs-' + v).hidden = v !== view;
  });
  if (view === 'packs') renderVsPacks();
  if (view === 'bank') { vsFillTopicFilter(); renderVsBank(); }
  if (view === 'mistakes') renderMistakes();
}

/* ================= VIẾT ================= */
const WritingCore = window.WritingCore;
const WRITING_MODES = {
  chunks: { kicker: 'SẮP XẾP CÂU', title: 'Tạo một câu hoàn chỉnh', lead: 'Chọn các cụm theo đúng thứ tự.' },
  dictation: { kicker: 'NGHE – VIẾT', title: 'Nghe và ghi lại chính xác', lead: 'Bạn có thể nghe lại hoặc giảm tốc độ.' },
  reverse: { kicker: 'DỊCH NGƯỢC', title: 'Diễn đạt lại bằng ngôn ngữ đang học', lead: 'Ưu tiên câu tự nhiên, không cần dịch từng chữ.' },
  free: { kicker: 'VIẾT TỰ DO', title: 'Phát triển ý thành một đoạn ngắn', lead: 'Viết 3–5 câu, sau đó nhận góp ý từ Cô Linh.' }
};
const FREE_PROMPTS = {
  en: ['Write about your daily routine.', 'Describe your favourite food.', 'What do you usually do at the weekend?', 'Write about your plans for this year.'],
  zh: ['请写一写你每天的生活。', '请介绍你最喜欢的食物。', '你周末通常做什么？', '请写一写你今年的计划。']
};
const writingState = { mode: 'chunks', language: null, queue: [], index: 0, completed: 0, correct: 0, sessionTotal: 5, attempts: 0, target: null, chunks: [], built: [], prompt: '' };

function writingButton(label, className, action) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = className; button.textContent = label; button.addEventListener('click', action);
  return button;
}
function resetWritingFeedback() {
  const feedback = $('#writingFeedback');
  feedback.hidden = true; feedback.removeAttribute('data-state'); feedback.replaceChildren();
}
function showWritingFeedback(state, title, body, options = {}) {
  const feedback = $('#writingFeedback');
  feedback.replaceChildren(); feedback.hidden = false; feedback.dataset.state = state;
  const heading = document.createElement('h4'); heading.textContent = title;
  const copy = document.createElement('p'); copy.textContent = body;
  feedback.append(heading, copy);
  if (options.correction) {
    const correction = document.createElement('div'); correction.className = 'writing-correction'; correction.textContent = options.correction;
    feedback.append(correction);
  }
  if (options.next) feedback.append(writingButton('Câu tiếp theo', 'btn primary writing-next', () => completeWritingItem(options.correct !== false)));
  feedback.focus({ preventScroll: true });
}
function updateWritingProgress() {
  const current = Math.min(writingState.completed + 1, writingState.sessionTotal);
  $('#writingProgressLabel').textContent = `Câu ${current} / ${writingState.sessionTotal}`;
  $('#writingProgressBar').style.width = `${(current / writingState.sessionTotal) * 100}%`;
  $('#writingScore').textContent = `${writingState.correct} câu đúng`;
}
function refillWritingQueue() {
  const pool = vocabItems(LV.language).filter((item) => item && item.example);
  writingState.queue = shuffleArr(pool).slice(0, Math.max(writingState.sessionTotal, 1));
  writingState.index = 0;
}
function completeWritingItem(correct) {
  writingState.completed += 1;
  if (correct) writingState.correct += 1;
  if (writingState.completed >= writingState.sessionTotal) {
    LV.toast(`Hoàn thành phiên viết: ${writingState.correct}/${writingState.sessionTotal} câu đúng.`);
    writingState.completed = 0; writingState.correct = 0; refillWritingQueue();
  } else writingState.index = (writingState.index + 1) % writingState.queue.length;
  renderWritingExercise();
}
function startWriting(mode, force = false) {
  const modeChanged = writingState.mode !== mode;
  const languageChanged = writingState.language !== LV.language;
  if (!force && !modeChanged && !languageChanged && writingState.target && $('#writingArea').children.length) return;
  writingState.mode = mode; writingState.language = LV.language;
  if (modeChanged || languageChanged || !writingState.queue.length) {
    writingState.completed = 0; writingState.correct = 0; refillWritingQueue();
  }
  renderWritingExercise();
}
function renderWritingExercise() {
  if (!writingState.queue.length) refillWritingQueue();
  writingState.target = writingState.queue[writingState.index % writingState.queue.length];
  writingState.attempts = 0; writingState.built = [];
  resetWritingFeedback(); updateWritingProgress();
  const meta = WRITING_MODES[writingState.mode];
  $('#writingModeKicker').textContent = meta.kicker; $('#writingPromptTitle').textContent = meta.title; $('#writingPromptLead').textContent = meta.lead;
  $('#writingLevelChip').textContent = writingState.target?.topic || 'Bài luyện cá nhân';
  const area = $('#writingArea'); area.replaceChildren();
  if (writingState.mode === 'chunks') renderChunksExercise(area);
  else if (writingState.mode === 'dictation') renderDictationExercise(area);
  else if (writingState.mode === 'reverse') renderReverseExercise(area);
  else renderFreeExercise(area);
}
function renderChunksExercise(area) {
  const target = writingState.target; const lang = LV.language;
  writingState.chunks = WritingCore.shuffleChunks(WritingCore.createChunks(target.example, lang));
  const instruction = document.createElement('p'); instruction.className = 'writing-instruction';
  instruction.append('Dùng từ '); const keyword = document.createElement('strong'); keyword.textContent = `“${target.term}” (${target.meaning})`; instruction.append(keyword, ' để tạo câu.');
  const bank = document.createElement('div'); bank.className = 'chunk-bank'; bank.id = 'chunkBank'; bank.setAttribute('aria-label', 'Các cụm từ chưa chọn');
  const answer = document.createElement('div'); answer.className = 'chunk-answer'; answer.id = 'chunkAnswer'; answer.setAttribute('aria-label', 'Câu trả lời đã sắp xếp');
  const render = () => {
    bank.replaceChildren(); answer.replaceChildren();
    writingState.chunks.forEach((chunk) => {
      const used = writingState.built.some((built) => built.id === chunk.id);
      const button = writingButton(chunk.text, 'chunk' + (used ? ' used' : ''), () => { if (!used) { writingState.built.push(chunk); render(); } });
      button.disabled = used; bank.append(button);
    });
    writingState.built.forEach((chunk, index) => answer.append(writingButton(chunk.text, 'chunk', () => { writingState.built.splice(index, 1); render(); })));
  };
  const actions = document.createElement('div'); actions.className = 'writing-actions';
  const undo = writingButton('Hoàn tác', 'btn ghost', () => { writingState.built.pop(); render(); resetWritingFeedback(); });
  const reset = writingButton('Làm lại', 'btn ghost', () => { writingState.built = []; render(); resetWritingFeedback(); });
  const listen = writingButton('Nghe mẫu', 'btn ghost', () => LV.playText(target.example, lang, { announceFallback: false }));
  const check = writingButton('Kiểm tra', 'btn primary', checkChunks);
  actions.append(undo, reset, listen, check); area.append(instruction, bank, answer, actions); render();
}
function checkChunks() {
  if (writingState.built.length !== writingState.chunks.length) return showWritingFeedback('error', 'Chưa đủ cụm từ', 'Hãy dùng tất cả các cụm rồi kiểm tra lại. Bạn vẫn có thể bấm vào cụm đã chọn để bỏ ra.');
  writingState.attempts += 1;
  const separator = LV.language === 'zh' ? '' : ' ';
  const answer = writingState.built.map((chunk) => chunk.text).join(separator);
  const result = WritingCore.compareText(answer, writingState.target.example, LV.language);
  if (result.exact) return showWritingFeedback('success', 'Chính xác!', 'Các từ đã ở đúng trật tự. Hãy nghe lại để ghi nhớ nhịp câu.', { next: true, correct: writingState.attempts === 1 });
  addMistake('writing', `Sắp xếp câu sai: “${writingState.target.example}”`, writingState.target.example);
  const accuracy = Math.round(result.positionAccuracy * 100);
  if (writingState.attempts === 1) return showWritingFeedback('error', 'Trật tự chưa đúng', `${accuracy}% cụm/từ đang ở đúng vị trí. Bấm vào một cụm trong câu trả lời để đưa nó về kho, rồi thử lại.`);
  showWritingFeedback('error', 'Thử đối chiếu rồi viết lại', 'Bạn đã thử hai lần. Xem mẫu dưới đây, sau đó sắp xếp lại để tự hoàn thành.', { correction: writingState.target.example });
}
function makeWritingField(id, labelText, placeholder, helper) {
  const field = document.createElement('div'); field.className = 'writing-field';
  const label = document.createElement('label'); label.htmlFor = id; label.textContent = labelText;
  const input = document.createElement('textarea'); input.id = id; input.placeholder = placeholder; input.setAttribute('aria-describedby', `${id}Helper`);
  const meta = document.createElement('div'); meta.className = 'writing-field-meta'; meta.id = `${id}Helper`;
  const help = document.createElement('span'); help.textContent = helper; const count = document.createElement('span'); count.textContent = '0 ký tự';
  input.addEventListener('input', () => { count.textContent = `${input.value.length} ký tự`; input.removeAttribute('aria-invalid'); });
  meta.append(help, count); field.append(label, input, meta); return { field, input };
}
function renderDictationExercise(area) {
  const target = writingState.target; const lang = LV.language;
  const instruction = document.createElement('p'); instruction.className = 'writing-instruction'; instruction.textContent = `Từ khóa: “${target.term}” — ${target.meaning}`;
  const { field, input } = makeWritingField('writingDictation', 'Câu bạn nghe được', 'Gõ lại câu đã nghe…', 'Không phân biệt chữ hoa và một số dấu câu; cần đúng từ và thứ tự.');
  const actions = document.createElement('div'); actions.className = 'writing-actions';
  const listen = writingButton('Nghe câu', 'btn ghost', () => LV.playText(target.example, lang, { announceFallback: false }));
  const slow = writingButton('Nghe chậm', 'btn ghost', () => LV.playText(target.example, lang, { announceFallback: false, speed: 0.75 }));
  const check = writingButton('So sánh', 'btn primary', () => {
    if (!input.value.trim()) { input.setAttribute('aria-invalid', 'true'); input.focus(); return showWritingFeedback('error', 'Bạn chưa nhập câu', 'Hãy nghe câu mẫu, gõ lại điều bạn nghe được rồi bấm “So sánh”.'); }
    writingState.attempts += 1;
    const result = WritingCore.compareText(input.value, target.example, lang);
    if (result.exact) return showWritingFeedback('success', 'Nghe chính xác!', 'Bạn đã viết đúng toàn bộ câu.', { next: true, correct: writingState.attempts === 1 });
    input.setAttribute('aria-invalid', 'true'); addMistake('listening', `Dictation sai: “${target.example}”`, target.example);
    const accuracy = Math.round(result.positionAccuracy * 100);
    if (writingState.attempts === 1) return showWritingFeedback('error', 'Cần nghe lại một chút', `${accuracy}% từ đang đúng vị trí. Nghe chậm, sửa ngay trong ô rồi so sánh lần nữa.`);
    showWritingFeedback('error', 'Đối chiếu câu mẫu', 'Xem câu đúng, sửa lại câu của bạn rồi bấm “So sánh” để tự hoàn thành.', { correction: target.example });
  });
  actions.append(listen, slow, check); area.append(instruction, field, actions); input.focus({ preventScroll: true });
}
function renderReverseExercise(area) {
  const target = writingState.target; const lang = LV.language;
  const instruction = document.createElement('p'); instruction.className = 'writing-instruction'; instruction.textContent = `Dịch sang ${LV.LANG_LABEL[lang]}: “${target.translation}”`;
  const { field, input } = makeWritingField('writingReverse', 'Câu của bạn', 'Viết câu bằng ngôn ngữ đang học…', 'Mẹo: Ctrl/⌘ + Enter để gửi cô chấm.');
  const actions = document.createElement('div'); actions.className = 'writing-actions';
  actions.append(writingButton('Xem từ mục tiêu', 'btn ghost', () => LV.toast(`${target.term} — ${target.meaning}`)));
  const submit = writingButton('Gửi Cô Linh chấm', 'btn primary', () => submitWritingFeedback(input.value, `Dịch câu: ${target.translation}`, lang, $('#writingFeedback')));
  actions.append(submit); input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); submit.click(); } });
  area.append(instruction, field, actions); input.focus({ preventScroll: true });
}
function renderFreeExercise(area) {
  const prompts = FREE_PROMPTS[LV.language] || FREE_PROMPTS.en;
  writingState.prompt = prompts[writingState.index % prompts.length];
  const instruction = document.createElement('p'); instruction.className = 'writing-instruction'; instruction.textContent = `Chủ đề: “${writingState.prompt}”`;
  const { field, input } = makeWritingField('writingFree', 'Đoạn viết của bạn', 'Viết 3–5 câu…', 'Nêu một ý chính và thêm ít nhất một chi tiết.');
  const actions = document.createElement('div'); actions.className = 'writing-actions';
  const submit = writingButton('Gửi Cô Linh chấm', 'btn primary', () => submitWritingFeedback(input.value, writingState.prompt, LV.language, $('#writingFeedback')));
  actions.append(submit); input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); submit.click(); } });
  area.append(instruction, field, actions); input.focus({ preventScroll: true });
}
function normalizeText(t) {
  return String(t || '').toLowerCase().replace(/[.,!?;:'"“”‘’]/g, ' ').replace(/\s+/g, ' ').trim();
}
function simRatio(a, b) {
  if (!a || !b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  let match = 0;
  for (let i = 0; i <= longer.length - shorter.length; i++) {
    let same = 0;
    for (let j = 0; j < shorter.length; j++) if (longer[i + j] === shorter[j]) same++;
    match = Math.max(match, same);
  }
  return match / shorter.length;
}
async function submitWritingFeedback(text, prompt, lang, fbEl) {
  const t = (text || '').trim();
  if (!t) return showWritingFeedback('error', 'Bạn chưa có nội dung', 'Hãy viết câu hoặc đoạn văn trước khi gửi Cô Linh chấm.');
  fbEl.hidden = false; fbEl.dataset.state = 'loading'; fbEl.replaceChildren();
  const loadingTitle = document.createElement('h4'); loadingTitle.textContent = 'Cô Linh đang đọc bài…';
  const loadingCopy = document.createElement('p'); loadingCopy.textContent = 'Cô sẽ tập trung vào một điểm quan trọng nhất để bạn sửa ngay.';
  fbEl.append(loadingTitle, loadingCopy);
  try {
    const res = await fetch('/api/writing/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t, prompt, language: lang }) });
    const data = await res.json();
    if (!res.ok) {
      const message = data.code === 'NO_AI' ? 'Chưa cấu hình dịch vụ AI để chấm bài. Bài viết của bạn vẫn được giữ nguyên.' : 'Dịch vụ chấm bài đang gián đoạn. Hãy giữ nguyên nội dung và thử gửi lại.';
      showWritingFeedback('error', 'Chưa thể chấm bài', message); return;
    }
    fbEl.hidden = false; fbEl.dataset.state = 'success'; fbEl.replaceChildren();
    const title = document.createElement('h4'); title.textContent = data.praise || 'Bạn đã hoàn thành bài viết.';
    const fix = document.createElement('p'); fix.textContent = `Điểm cần sửa: ${data.fix || 'Không có lỗi nổi bật.'}`;
    const correction = document.createElement('div'); correction.className = 'writing-correction'; correction.textContent = `Gợi ý viết lại: ${data.corrected || t}`;
    const why = document.createElement('p'); why.textContent = `Vì sao: ${data.why || 'Cách viết này tự nhiên và rõ nghĩa hơn.'}`;
    const retry = document.createElement('p'); retry.textContent = `Thử tiếp: ${data.retry || 'Viết lại một lần bằng cách diễn đạt của bạn.'}`;
    fbEl.append(title, fix, correction, why, retry, writingButton('Câu tiếp theo', 'btn primary writing-next', () => completeWritingItem(true)));
    fbEl.focus({ preventScroll: true });
    addMistake('writing', data.fix, data.corrected);
    renderMistakes();
  } catch { showWritingFeedback('error', 'Mất kết nối', 'Bài viết của bạn vẫn còn trong ô. Kiểm tra mạng rồi bấm gửi lại.'); }
}

/* ================= NÓI (P2) ================= */
const shadowState = { queue: [], index: 0 };
function shadowNext() {
  if (!shadowState.queue.length) shadowState.queue = LV.allSentences(LV.language);
  shadowState.index = (shadowState.index + 1) % shadowState.queue.length;
  const s = shadowState.queue[shadowState.index];
  $('#shadowSentence').textContent = `“${s.text}” — ${s.vi}`;
  $('#shadowTranscript').textContent = '';
  LV.setTeacherLastSentence(s);
  return s;
}
function shadowRecord() {
  const s = shadowState.queue[shadowState.index];
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { $('#shadowTranscript').textContent = 'Trình duyệt chưa hỗ trợ nhận diện giọng nói.'; return; }
  const r = new Recognition();
  r.lang = LV.SPEECH_LANG[LV.language];
  r.interimResults = false;
  r.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const ok = normalizeText(transcript) === normalizeText(s.text) || simRatio(normalizeText(transcript), normalizeText(s.text)) > 0.6;
    $('#shadowTranscript').textContent = ok
      ? `Bạn nói: “${transcript}” — khớp tốt! ✓`
      : `Bạn nói: “${transcript}” — chưa khớp, nghe lại và thử tiếp.`;
    if (!ok) addMistake('speaking', `Shadowing: mẫu “${s.text}”`, s.text);
    renderMistakes();
  };
  r.onerror = () => { $('#shadowTranscript').textContent = 'Không nhận diện được. Thử ở nơi yên tĩnh.'; };
  r.start();
  $('#shadowTranscript').textContent = 'Đang nghe…';
}

/* ---- Nghe lại giọng mình vừa nói: phát blob ghi âm cục bộ (không upload) ---- */
function pronReplayInto(btnOrId, url) {
  const btn = typeof btnOrId === 'string' ? document.getElementById(btnOrId) : btnOrId;
  if (!btn) return;
  if (!url) { btn.hidden = true; btn.onclick = null; return; }
  btn.hidden = false;
  btn.onclick = () => {
    const audio = new Audio(url);
    btn.classList.add('playing');
    const done = () => btn.classList.remove('playing');
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  };
}

/* ---- PHÁT ÂM: nghe mẫu → nói → so từng từ + AI chỉ lỗi ---- */
const pronState = { item: null, busy: false };
function pronPool(source) {
  if (source === 'words') {
    const items = vocabItems(LV.language).filter((v) => v.term);
    return items.map((v) => ({ kind: 'word', id: v.id, text: v.term, ipa: v.ipa || '', vi: v.meaning || '' }));
  }
  return LV.allSentences(LV.language).map((s) => ({ kind: 'sentence', id: s.id, text: s.text, ipa: '', vi: s.vi || '' }));
}
function pronPick() {
  const pool = pronPool($('#pronSource').value);
  if (!pool.length) { pronState.item = null; $('#pronText').textContent = 'Chưa có nội dung để luyện.'; return; }
  pronState.item = pool[Math.floor(Math.random() * pool.length)];
  const it = pronState.item;
  $('#pronTarget').lang = LV.language === 'zh' ? 'zh-CN' : 'en';
  $('#pronText').textContent = it.text;
  $('#pronIpa').textContent = it.ipa || '';
  $('#pronMeaning').textContent = it.vi ? `Nghĩa: ${it.vi}` : '';
  $('#pronStatus').textContent = '';
  $('#pronResult').hidden = true;
  $('#pronFeedback').replaceChildren();
  $('#pronWords').replaceChildren();
  pronReplayInto('pronReplay', '');
}
function pronRenderDiff(aligned) {
  pronRenderDiffInto($('#pronWords'), aligned);
}
function pronRenderDiffInto(el, aligned) {
  el.replaceChildren();
  for (const a of aligned) {
    const chip = document.createElement('span');
    chip.className = `pron-word pron-${a.status}`;
    chip.textContent = a.word;
    chip.title = a.status === 'wrong' ? `Nghe thành “${a.heard}”` : a.status === 'missing' ? 'Không nghe được từ này' : 'Đúng';
    el.appendChild(chip);
  }
}
function pronScoreLabel(s) {
  if (s >= 90) return 'Tuyệt vời!';
  if (s >= 70) return 'Khá tốt, còn vài chỗ cần sửa.';
  if (s >= 40) return 'Cố lên chút nữa nhé.';
  return 'Thử nghe mẫu lại rồi nói chậm hơn nhé.';
}
async function pronRecord() {
  if (pronState.busy) return;
  const it = pronState.item;
  if (!it) { pronPick(); return; }
  pronState.busy = true;
  $('#pronMic').disabled = true;
  $('#pronMic').setAttribute('aria-pressed', 'true');
  $('#pronResult').hidden = true;
  $('#pronStatus').textContent = 'Đang nghe bạn nói…';
  const recOn = await LV.selfRecord.start();
  const heard = await LV.listenOnce({
    language: LV.SPEECH_LANG[LV.language],
    timeoutMs: 12000,
    onListening: () => { $('#pronStatus').textContent = 'Đang nghe bạn nói…'; },
    onProcessing: () => { $('#pronStatus').textContent = 'Đang nhận dạng câu nói…'; },
    onError: () => { $('#pronStatus').textContent = 'Không nhận diện được. Hãy thử lại ở nơi yên tĩnh.'; }
  });
  const myVoice = recOn ? await LV.selfRecord.stop() : '';
  pronReplayInto('pronReplay', myVoice);
  $('#pronMic').disabled = false;
  $('#pronMic').setAttribute('aria-pressed', 'false');
  pronState.busy = false;
  if (!heard) return;
  const aligned = window.Pron.align(it.text, heard, LV.language);
  const localScore = window.Pron.score(aligned);
  pronRenderDiff(aligned);
  $('#pronResult').hidden = false;
  $('#pronScoreFill').style.width = `${localScore}%`;
  $('#pronScoreText').textContent = `${localScore}/100`;
  $('#pronStatus').textContent = `Bạn nói: “${heard}”`;
  // Nghe khớp hoàn toàn theo client thì không cần AI; có lệch mới nhờ AI chỉ mẹo sửa
  if (localScore >= 100) {
    const fbEl = $('#pronFeedback');
    fbEl.replaceChildren();
    const praise = document.createElement('p');
    praise.className = 'pron-praise';
    praise.textContent = pronScoreLabel(100);
    fbEl.appendChild(praise);
    pronCredit(it, 100);
    return;
  }
  await pronAskAi(it, heard);
}
async function pronAskAi(it, heard) {
  const fbEl = $('#pronFeedback');
  fbEl.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'hint';
  loading.textContent = 'Cô Linh đang phân tích chỗ phát âm chưa đúng…';
  fbEl.appendChild(loading);
  const level = store.profile.placement?.[LV.language]?.level || 2;
  try {
    const res = await fetch('/api/pronunciation/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: it.text, heard, language: LV.language, level })
    });
    const d = await res.json();
    fbEl.replaceChildren();
    if (!res.ok) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = d.code === 'NO_AI'
        ? 'Chưa cấu hình AI nên chưa có mẹo sửa chi tiết. So từng từ phía trên vẫn dùng được.'
        : 'Chưa phân tích được phát âm lúc này — bạn vẫn xem được so từng từ phía trên.';
      fbEl.appendChild(p);
      return;
    }
    $('#pronScoreFill').style.width = `${d.score}%`;
    $('#pronScoreText').textContent = `${d.score}/100`;
    pronFeedbackInto(fbEl, d);
    pronCredit(it, d.score);
  } catch {
    fbEl.replaceChildren();
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Mất kết nối tới AI — bạn vẫn xem được so từng từ phía trên.';
    fbEl.appendChild(p);
  }
}
// Nhận xét AI dùng chung cho cả tab Nói và thẻ từ trong phiên học
function pronFeedbackInto(el, d) {
  const praise = document.createElement('p');
  praise.className = 'pron-praise';
  praise.textContent = d.praise;
  el.appendChild(praise);
  for (const issue of d.issues || []) {
    const row = document.createElement('div');
    row.className = 'pron-issue';
    const head = document.createElement('b');
    head.textContent = issue.heardAs ? `“${issue.word}” nghe thành “${issue.heardAs}”` : `Thiếu từ “${issue.word}”`;
    const tip = document.createElement('span');
    tip.textContent = issue.tip;
    row.append(head, tip);
    el.appendChild(row);
  }
  const drill = document.createElement('p');
  drill.className = 'pron-drill';
  drill.textContent = `Luyện tiếp: ${d.drill}`;
  el.appendChild(drill);
}
// Ghi nhận kết quả: sai thì vào sổ lỗi; luyện từ đã học thì chấm SRS theo điểm
function pronCredit(it, scoreNum) {
  if (scoreNum < 90) addMistake('speaking', `Phát âm: “${it.text}”`, it.text);
  if (it.kind === 'word' && it.id) {
    srsRecord(it.id, LV.language, scoreNum >= 85 ? 3 : scoreNum >= 60 ? 2 : 1, 'speaking');
  }
  recordActivity(1, 1);
  renderMistakes();
}

/* ---- Luyện đọc/nói NGAY TRONG thẻ từ của phiên học (từ hoặc câu mẫu) ---- */
const vsPronState = { item: null, target: 'word', busy: false };
function vsPronReset(v) {
  vsPronState.item = v;
  vsPronState.target = 'word';
  vsPronState.busy = false;
  for (const b of document.querySelectorAll('#vsPronTargets button')) {
    const on = b.dataset.target === 'word';
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  }
  vsPronShowTarget();
  document.getElementById('vsPronStatus').textContent = '';
  document.getElementById('vsPronResult').hidden = true;
  document.getElementById('vsPronFeedback').replaceChildren();
  document.getElementById('vsPronWords').replaceChildren();
  pronReplayInto('vsPronReplay', '');
}
function vsPronShowTarget() {
  const v = vsPronState.item;
  if (!v) return;
  document.getElementById('vsPronText').textContent = vsPronTargetText();
  const isZh = LV.language === 'zh';
  const word = vsPronState.target === 'word';
  document.getElementById('vsPronIpa').textContent = word
    ? (isZh ? (v.pinyin || '') : (v.ipa || ''))
    : (isZh ? (v.examplePinyin || '') : '');
}
function vsPronTargetText() {
  const v = vsPronState.item;
  if (!v) return '';
  return vsPronState.target === 'sentence' ? (v.example || v.term) : v.term;
}
function vsPronSetTarget(target) {
  if (vsPronState.busy || vsPronState.target === target) return;
  vsPronState.target = target;
  for (const b of document.querySelectorAll('#vsPronTargets button')) {
    const on = b.dataset.target === target;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  }
  vsPronShowTarget();
  document.getElementById('vsPronStatus').textContent = '';
  document.getElementById('vsPronResult').hidden = true;
  pronReplayInto('vsPronReplay', '');
}
async function vsPronRecord() {
  if (vsPronState.busy || !vsPronState.item) return;
  const v = vsPronState.item;
  const target = vsPronTargetText();
  const mic = document.getElementById('vsPronMic');
  vsPronState.busy = true;
  mic.disabled = true;
  mic.setAttribute('aria-pressed', 'true');
  const resultEl = document.getElementById('vsPronResult');
  resultEl.hidden = true;
  const statusEl = document.getElementById('vsPronStatus');
  statusEl.textContent = 'Đang nghe bạn đọc…';
  const recOn = await LV.selfRecord.start();
  const heard = await LV.listenOnce({
    language: LV.SPEECH_LANG[LV.language],
    timeoutMs: 10000,
    onListening: () => { statusEl.textContent = 'Đang nghe bạn đọc…'; },
    onProcessing: () => { statusEl.textContent = 'Đang nhận dạng…'; },
    onError: () => { statusEl.textContent = 'Không nghe rõ — thử lại ở nơi yên tĩnh nhé.'; }
  });
  const myVoice = recOn ? await LV.selfRecord.stop() : '';
  pronReplayInto('vsPronReplay', myVoice);
  mic.disabled = false;
  mic.setAttribute('aria-pressed', 'false');
  vsPronState.busy = false;
  if (!heard) return;
  const aligned = window.Pron.align(target, heard, LV.language);
  const scoreNum = window.Pron.score(aligned);
  pronRenderDiffInto(document.getElementById('vsPronWords'), aligned);
  resultEl.hidden = false;
  document.getElementById('vsPronScore').textContent = `${scoreNum}/100 — ${pronScoreLabel(scoreNum)}`;
  statusEl.textContent = `Bạn đọc: “${heard}”`;
  if (scoreNum < 90) addMistake('speaking', `Đọc từ: “${v.term}”`, v.term);
  renderMistakes();
  const fbEl = document.getElementById('vsPronFeedback');
  fbEl.replaceChildren();
  if (scoreNum >= 100) {
    const praise = document.createElement('p');
    praise.className = 'pron-praise';
    praise.textContent = 'Chuẩn không cần chỉnh! Bấm “Đã hiểu” để sang từ tiếp theo.';
    fbEl.appendChild(praise);
    return;
  }
  const loading = document.createElement('p');
  loading.className = 'hint';
  loading.textContent = 'Cô Linh đang nghe cách bạn đọc…';
  fbEl.appendChild(loading);
  const level = store.profile.placement?.[LV.language]?.level || 2;
  try {
    const res = await fetch('/api/pronunciation/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, heard, language: LV.language, level })
    });
    const d = await res.json();
    fbEl.replaceChildren();
    if (!res.ok) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = d.code === 'NO_AI'
        ? 'Chưa cấu hình AI nên chưa có mẹo chi tiết — so từng từ phía trên vẫn dùng được.'
        : 'Chưa phân tích được lúc này — bạn vẫn xem được so từng từ phía trên.';
      fbEl.appendChild(p);
      return;
    }
    document.getElementById('vsPronScore').textContent = `${d.score}/100 — ${d.praise}`;
    pronFeedbackInto(fbEl, d);
  } catch {
    fbEl.replaceChildren();
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Mất kết nối tới AI — bạn vẫn xem được so từng từ phía trên.';
    fbEl.appendChild(p);
  }
}

const rpState = { scenario: null, history: [], running: false };
function rpAdd(role, text, opts = {}) {
  const chat = $('#rpChat');
  const row = document.createElement('div'); row.className = 'msg ' + role;
  const bubble = document.createElement('span'); bubble.className = 'bubble';
  bubble.textContent = text;
  if (opts.speak) {
    const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'speak-chip';
    chip.textContent = 'Nghe lại';
    chip.onclick = () => LV.playText(text, LV.language, { announceFallback: false });
    bubble.appendChild(chip);
  }
  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}
async function rpStart() {
  const id = $('#scenarioSelect').value;
  rpState.scenario = ROLEPLAY_SCENARIOS.find((s) => s.id === id);
  rpState.history = [];
  rpState.running = true;
  $('#rpChat').replaceChildren();
  $('#rpHint').textContent = '';
  rpAdd('teacher', `[${rpState.scenario.vi}]`);
  await rpTurn();
}
async function rpTurn() {
  const level = store.profile.placement?.[LV.language]?.level || 2;
  $('#rpHint').textContent = 'Nhân viên đang suy nghĩ…';
  try {
    const res = await fetch('/api/roleplay/turn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: rpState.scenario, language: LV.language, level, history: rpState.history }) });
    const data = await res.json();
    if (!res.ok) { $('#rpHint').textContent = data.code === 'NO_AI' ? 'Cần key AI để chơi roleplay.' : 'Lỗi kết nối.'; return; }
    rpAdd('teacher', data.reply, { speak: true });
    $('#rpHint').textContent = data.hint || '';
    LV.playText(data.reply, LV.language, { announceFallback: false });
  } catch { $('#rpHint').textContent = 'Mất kết nối.'; }
}
async function rpSend() {
  const text = $('#rpInput').value.trim();
  if (!text || !rpState.running) return;
  $('#rpInput').value = '';
  rpState.history.push({ role: 'user', text });
  rpAdd('user', text);
  await rpTurn();
}
async function rpMic() {
  if (!rpState.running) { LV.toast('Chọn tình huống và bắt đầu cuộc gọi trước.'); return; }
  const mic = $('#rpMic');
  const t = await LV.listenOnce({
    language: LV.SPEECH_LANG[LV.language],
    timeoutMs: 12000,
    onStart: () => { mic.classList.add('recording'); $('#rpHint').textContent = 'Đang mở micro…'; },
    onListening: () => { mic.classList.add('recording'); $('#rpHint').textContent = 'Đang nghe bạn nói…'; },
    onProcessing: () => { $('#rpHint').textContent = 'Đang nhận dạng câu nói…'; },
    onError: () => { $('#rpHint').textContent = 'Không nhận diện được. Hãy gõ hoặc nói lại ở nơi yên tĩnh.'; },
    onEnd: () => mic.classList.remove('recording')
  });
  if (t) {
    $('#rpHint').textContent = `Bạn nói: “${t}”`;
    $('#rpInput').value = t;
    rpSend();
  }
}

async function rpEnd() {
  if (rpState.history.length) {
    $('#rpHint').textContent = 'Cô đang nhận xét cuộc gọi của bạn…';
    try {
      const res = await fetch('/api/roleplay/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: rpState.scenario, language: LV.language, history: rpState.history }) });
      const d = await res.json();
      if (res.ok) {
        const parts = [`[Nhận xét cuộc gọi]`, `✓ ${d.praise}`, `Cần cải thiện: ${d.topFix}`];
        if (d.corrected) parts.push(`Câu sửa đúng: “${d.corrected}”`);
        parts.push(`Bước tiếp theo: ${d.next}`);
        rpAdd('teacher', parts.join('\n'));
        if (d.topFix) addMistake('speaking', `Hội thoại: ${d.topFix}`, d.corrected);
        renderMistakes();
        syncMemory();
      } else if (d.code === 'NO_AI') {
        rpAdd('teacher', 'Cô cần key AI để nhận xét cuộc gọi.');
      }
    } catch { rpAdd('teacher', 'Không nhận xét được cuộc gọi.'); }
  }
  rpState.running = false;
  $('#rpHint').textContent = 'Đã kết thúc cuộc gọi. Chọn tình huống khác để gọi tiếp.';
}

const qaState = { history: [], busy: false };
const vcState = { auto: false, listening: false, rec: null };
function vcListen() {
  vcState.listening = true;
  return LV.listenOnce({
    language: LV.SPEECH_LANG[LV.language],
    timeoutMs: 12000,
    onReady: (controller) => { vcState.rec = controller; },
    onStart: () => {
      vcState.listening = true;
      document.body.classList.add('co-listening');
      LV.setCoLinhState('listening', 'Cô đang mở micro…');
    },
    onListening: () => {
      vcState.listening = true;
      document.body.classList.add('co-listening');
      LV.setCoLinhState('listening', 'Cô đang nghe bạn nói…');
    },
    onProcessing: () => LV.setCoLinhState('thinking', 'Cô đang nhận dạng câu nói…'),
    onError: () => LV.setCoLinhState('error', 'Cô chưa nghe rõ — bạn hãy thử lại hoặc gõ.'),
    onEnd: (val) => {
      vcState.listening = false;
      vcState.rec = null;
      document.body.classList.remove('co-listening');
      LV.setCoLinhState('idle', val ? 'Cô đã nghe rõ. Đang chuẩn bị trả lời…' : 'Chưa nghe rõ — bạn có thể nói lại hoặc gõ.');
    }
  });
}

async function qaMic() {
  const mic = $('#qaMic');
  const t = await LV.listenOnce({
    language: LV.SPEECH_LANG[LV.language],
    timeoutMs: 12000,
    onStart: () => {
      mic.classList.add('recording');
      document.body.classList.add('co-listening');
      LV.setCoLinhState('listening', 'Cô đang mở micro…');
    },
    onListening: () => {
      mic.classList.add('recording');
      document.body.classList.add('co-listening');
      LV.setCoLinhState('listening', 'Cô đang nghe bạn nói…');
    },
    onProcessing: () => LV.setCoLinhState('thinking', 'Cô đang nhận dạng câu nói…'),
    onError: () => { LV.setCoLinhState('error', 'Cô chưa nghe rõ — bạn hãy thử lại hoặc gõ.'); LV.toast('Không nhận diện được. Hãy gõ nhé.'); },
    onEnd: () => {
      mic.classList.remove('recording');
      document.body.classList.remove('co-listening');
      if (document.getElementById('coStage')?.dataset.state === 'listening') LV.setCoLinhState('idle', 'Bạn có thể nói lại hoặc gõ tin nhắn.');
    }
  });
  if (t) qaSend(t);
}

function qaAdd(role, text, opts = {}) {
  const chat = $('#qaChat');
  const row = document.createElement('div'); row.className = 'msg ' + role;
  const bubble = document.createElement('span'); bubble.className = 'bubble';
  bubble.textContent = text;
  if (opts.speak) {
    const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'speak-chip';
    chip.textContent = 'Nghe lại';
    chip.addEventListener('click', () => LV.speakTargetSegments(text, LV.language));
    bubble.appendChild(chip);
  }
  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}
async function qaSend(textArg) {
  const text = String(textArg !== undefined ? textArg : $('#qaInput').value).trim();
  if (!text || qaState.busy) return;
  qaState.busy = true;
  $('#qaSend').disabled = true;
  $('#qaInput').disabled = true;
  $('#speak-qa').setAttribute('aria-busy', 'true');
  $('#qaInput').value = '';
  qaState.history.push({ role: 'user', text });
  if (qaState.history.length > 12) qaState.history = qaState.history.slice(-12);
  qaAdd('user', text);
  qaAdd('teacher', 'Cô đang suy nghĩ…');
  document.body.classList.add('co-thinking');
  LV.setCoLinhState('thinking', 'Cô đang xem câu của bạn…');
  const bubble = document.getElementById('coBubble');
  if (bubble) bubble.textContent = 'Để cô suy nghĩ một chút nhé';
  try {
    // Chỉ thị để cô giáo luôn kết thúc bằng câu mẫu 【 】 để đọc to (voice conversation)
    const instruction = vcState.auto
      ? text + '\n\n(Trả lời NGẮN 2-3 câu, ấm áp. Luôn kết thúc bằng đúng MỘT câu mẫu ngắn bằng ngôn ngữ đang học, bọc trong 【 】.)'
      : text + '\n\n(Lưu ý: hãy kết thúc trả lời bằng đúng MỘT câu mẫu ngắn bằng ngôn ngữ đang học, bọc trong 【 】 để đọc to.)';
    const res = await fetch('/api/teacher/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: instruction, language: LV.language, history: qaState.history.slice(-8), context: { screen: 'speaking', topic: 'Trò chuyện với cô giáo' }, assistantProfile: LV.getTeacherProfile() })
    });
    const data = await res.json();
    document.body.classList.remove('co-thinking');
    const last = $('#qaChat .msg.teacher:last-child');
    if (!res.ok) {
      const errorText = data.code === 'NO_AI' ? 'Cô chưa được kết nối AI.' : 'Kết nối đang gặp lỗi.';
      if (bubble) bubble.textContent = errorText;
      if (last) last.querySelector('.bubble').textContent = errorText;
      LV.setCoLinhState('error', 'Bạn hãy kiểm tra cấu hình hoặc thử lại sau.');
      return;
    }
    if (last) last.querySelector('.bubble').textContent = data.reply;
    if (bubble) bubble.textContent = data.reply;
    qaState.history.push({ role: 'teacher', text: data.reply });
    if (vcState.auto) {
      // Giao tiếp bằng giọng nói: nói ĐẦY ĐỦ phản hồi rồi TỰ nghe tiếp lời bạn
      await LV.speakTeacherReply(data.reply, data.language || LV.language);
      if (!vcState.auto) return;
      const heard = await vcListen();
      if (heard && vcState.auto) await qaSend(heard);
      else if (vcState.auto) LV.setCoLinhState('idle', 'Không nghe rõ — bấm Gửi hoặc nói lại.');
    } else {
      if (document.getElementById('teacherMute')?.getAttribute('aria-pressed') !== 'true') {
        await LV.speakTargetSegments(data.reply, data.language || LV.language);
      } else {
        LV.setCoLinhState('idle', 'Cô đã trả lời. Bật đọc to nếu bạn muốn nghe câu mẫu.');
      }
      const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'speak-chip';
      chip.textContent = 'Nghe lại';
      chip.addEventListener('click', () => LV.speakTargetSegments(data.reply, data.language || LV.language));
      if (last) last.querySelector('.bubble').appendChild(chip);
    }
  } catch {
    document.body.classList.remove('co-thinking');
    const last = $('#qaChat .msg.teacher:last-child');
    if (last) last.querySelector('.bubble').textContent = 'Mất kết nối.';
    if (bubble) bubble.textContent = 'Mất kết nối.';
    LV.setCoLinhState('error', 'Không thể kết nối máy chủ. Bạn hãy thử lại.');
  } finally {
    qaState.busy = false;
    $('#qaSend').disabled = false;
    $('#qaInput').disabled = false;
    $('#speak-qa').removeAttribute('aria-busy');
  }
}
/* ================= ĐỌC (P3) ================= */
let readState = { level: 1, text: null, answered: new Set() };
function renderReadLibrary() {
  const lang = LV.language;
  const list = $('#readList');
  list.replaceChildren();
  const texts = READING_TEXTS[lang]?.[readState.level] || [];
  if (!texts.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'Chưa có bài đọc cho cấp này.'; list.append(p); return; }
  for (const t of texts) {
    const li = document.createElement('li');
    const open = document.createElement('button'); open.type = 'button'; open.className = 'read-card';
    const b = document.createElement('b'); b.textContent = t.title;
    const small = document.createElement('small'); small.textContent = `${t.paragraphs.join(' ').length} ký tự · ${t.questions.length} câu hỏi`;
    open.append(b, small);
    open.addEventListener('click', () => openReader(t));
    li.append(open);
    list.append(li);
  }
}
function openReader(text) {
  readState.text = text;
  $('#readLibrary').hidden = true;
  $('#readView').hidden = false;
  $('#readTitle').textContent = text.title;
  const dict = buildDict(LV.language);
  const paras = $('#readParagraphs');
  paras.replaceChildren();
  for (const para of text.paragraphs) {
    const p = document.createElement('p');
    p.innerHTML = '';
    const lines = splitLines(para, LV.language);
    for (const line of lines) {
      const span = document.createElement('span'); span.className = 'seg-line';
      const tokens = tokenize(line, dict, LV.language);
      for (const tk of tokens) {
        if (tk.isWord) {
          const w = document.createElement('button'); w.type = 'button'; w.className = 'read-word'; w.textContent = tk.text; w.dataset.word = tk.text;
          w.setAttribute('aria-label', `Lưu từ ${tk.text} để ôn`);
          w.addEventListener('click', () => mineWord(tk.text));
          span.append(w);
          if (tk.punct) span.append(document.createTextNode(tk.punct));
        } else {
          span.append(document.createTextNode(tk.text + (tk.space || '')));
        }
      }
      p.append(span);
    }
    paras.append(p);
  }
  renderReadQuestions();
  renderReadMined();
}
function splitLines(text, lang) {
  return text.split(/(?<=[。！？.!?])\s*/).filter(Boolean);
}
function tokenize(line, dict, lang) {
  if (lang === 'zh') {
    // longest-match: ưu tiên cụm có trong từ điển
    const out = [];
    let i = 0;
    const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
    while (i < line.length) {
      let matched = null;
      for (const k of keys) { if (line.startsWith(k, i)) { matched = k; break; } }
      if (matched) { out.push({ text: matched, isWord: true }); i += matched.length; }
      else { out.push({ text: line[i], isWord: false }); i += 1; }
    }
    return out;
  }
  return line.split(/(\s+)/).filter(Boolean).map((t) => (/\s+/.test(t) ? { text: '', isWord: false, space: t } : { text: t.replace(/[.,!?;:]/g, ''), isWord: true, punct: t.match(/[.,!?;:]/g)?.[0] || '' }));
}
function mineWord(word) {
  const lang = LV.language;
  const dict = buildDict(lang);
  const meaning = dict[lang === 'zh' ? word : word.toLowerCase()];
  const id = `w:${lang}:${word.toLowerCase()}`;
  srsRecord(id, lang, 3, 'reading'); // mặc định vào review
  const m = store.mined;
  if (!m[lang].some((x) => x.term === word)) {
    m[lang].push({ term: word, meaning: meaning || '… (chưa có nghĩa — hỏi cô giáo)' });
    store.mined = m;
  }
  renderReadMined();
  LV.toast(meaning
    ? `Đã lưu “${word}” — ${meaning} vào ôn tập.`
    : `Đã lưu “${word}” để ôn. Bấm cô giáo góc phải để hỏi nghĩa nhé.`);
  // highlight
  document.querySelectorAll(`.read-word[data-word="${CSS.escape(word)}"]`).forEach((el) => { el.classList.add('highlighted'); });
}
function renderReadMined() {
  const list = $('#readMinedList');
  const items = store.mined[LV.language] || [];
  list.replaceChildren();
  if (!items.length) { $('#readMined').hidden = true; return; }
  $('#readMined').hidden = false;
  for (const it of items.slice(-10)) {
    const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = `${it.term} — ${it.meaning}`;
    list.append(chip);
  }
}
function renderReadQuestions() {
  const box = $('#readQuestions');
  const t = readState.text;
  box.replaceChildren();
  if (!t) return;
  t.questions.forEach((q, qi) => {
    const wrap = document.createElement('div');
    const qEl = document.createElement('p'); qEl.className = 'q'; qEl.textContent = `Hỏi ${qi + 1}: ${q.q}`;
    const choices = document.createElement('div'); choices.className = 'quiz-choices';
    q.options.forEach((opt, oi) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = opt;
      b.addEventListener('click', () => {
        const correct = oi === q.answer;
        choices.querySelectorAll('button').forEach((x) => { x.disabled = true; if (x === b) x.classList.add(correct ? 'correct' : 'incorrect'); if (!correct && q.options.indexOf(x.textContent) === q.answer) x.classList.add('correct'); });
        if (!correct) addMistake('reading', `Đọc hiểu sai: “${q.q}”`, q.options[q.answer]);
        renderMistakes();
      });
      choices.append(b);
    });
    wrap.append(qEl, choices);
    box.append(wrap);
  });
}
async function readAloud() {
  const t = readState.text;
  if (!t) return;
  for (const para of t.paragraphs) {
    for (const line of splitLines(para, LV.language)) {
      await LV.playText(line, LV.language, { announceFallback: false });
    }
  }
  LV.toast('Đã đọc xong bài.');
}

/* ================= LỘ TRÌNH & PLANNER (P4) ================= */
function dayOf() {
  const p = store.profile;
  if (!p.startedAt) return 1;
  return Math.min(90, Math.max(1, Math.floor((Date.now() - new Date(p.startedAt + 'T00:00:00')) / 86400000) + 1));
}
const PHASES = [
  { name: 'Nền tảng', days: '1–30', focus: 'Âm, thanh điệu, câu cơ bản, 500 cụm thiết yếu', checkpoint: 'Giới thiệu bản thân 60 giây' },
  { name: 'Bứt phá', days: '31–60', focus: 'Hội thoại đời thường, đọc 150–300 từ, viết đoạn ngắn', checkpoint: 'Nói 3 phút + tóm tắt bài đọc' },
  { name: 'Tự tin', days: '61–90', focus: 'Nghe tốc độ tự nhiên, chủ đề công việc/du lịch/quan điểm', checkpoint: 'Hội thoại AI 10 phút' }
];
function phaseOf() { const d = dayOf(); return d <= 30 ? 0 : d <= 60 ? 1 : 2; }
function buildDailyStack() {
  const p = store.profile;
  const mode = normalizeLearnerMode(p.ageGroup);
  const mins = p.dailyMinutes || 25;
  const enShare = (p.splitEn || 60) / 100;
  const langMain = LV.language;
  const share = langMain === 'en' ? enShare : 1 - enShare;
  const m = (f) => Math.max(3, Math.round(mins * f * share));
  const total = mins * Math.max(share, 0.3);
  if (mode === 'preschool') return [
    { title: 'Nghe và nhại lại', minutes: m(0.4), tab: 'listening', desc: 'Câu ngắn, âm rõ và có thể nghe lại', action: 'listening' },
    { title: 'Khám phá 3 từ', minutes: m(0.3), tab: 'vocab', desc: 'Từ quen thuộc qua câu mẫu', action: 'learn' },
    { title: 'Nói cùng Cô Linh', minutes: m(0.3), tab: 'speaking', desc: 'Một lượt nói vui cùng người lớn', action: 'speaking' }
  ];
  if (mode === 'child') return [
    { title: 'Từ và câu hôm nay', minutes: m(0.36), tab: 'vocab', desc: 'Học theo chủ đề gần gũi', action: 'learn' },
    { title: 'Nghe rồi nói', minutes: m(0.34), tab: 'speaking', desc: 'Phản xạ bằng câu hoàn chỉnh', action: 'speaking' },
    { title: 'Ôn thử thách', minutes: Math.max(3, Math.round(total - m(0.36) - m(0.34))), tab: 'vocab', desc: 'Ôn đúng lúc để nhớ lâu', action: 'review' }
  ];
  const blocks = [
    { title: 'Nghe + từ mới', minutes: m(0.34), tab: 'vocab', desc: 'Học cụm mới, nghe câu mẫu', action: 'learn' },
    { title: 'Đọc', minutes: m(0.26), tab: 'reading', desc: 'Bài đọc theo level', action: 'reading' },
    { title: 'Nói / Viết', minutes: m(0.26), tab: 'speaking', desc: 'Shadowing, roleplay hoặc viết câu', action: 'speaking' },
    { title: 'Ôn tập SRS', minutes: Math.max(3, Math.round(total - m(0.34) - m(0.26) - m(0.26))), tab: 'vocab', desc: 'Cụm sắp quên', action: 'review' }
  ];
  return blocks;
}
function skillLabel(s) { return { listening: 'nghe', reading: 'đọc', speaking: 'nói', writing: 'viết' }[s] || s; }

// ---- Tín hiệu "lỗi lặp lại" (pattern >= 2 lần, chưa xử lý) ----
function recurringMistakes() {
  const lang = LV.language;
  const counts = {};
  for (const m of store.mistakes) {
    if (m.lang === lang && m.status === 'new') counts[m.pattern] = (counts[m.pattern] || 0) + 1;
  }
  return Object.entries(counts).map(([pattern, c]) => ({ pattern, c })).filter((x) => x.c >= 2).sort((a, b) => b.c - a.c);
}

function findMistakeCorrect(pattern) {
  const m = store.mistakes.find((x) => x.lang === LV.language && x.pattern === pattern && x.correct);
  return m ? m.correct : null;
}

// ---- Cô giáo chủ động nhắc & dẫn dắt (từ trí nhớ dài hạn) ----
function buildCoach() {
  const lang = LV.language;
  const due = dueItems(lang, 99).length;
  const rec = recurringMistakes();
  const pl = store.profile.placement?.[lang];
  const goals = store.profile.goals || [];
  const glabel = { 'giao-tiep': 'giao tiếp', 'cong-viec': 'công việc', 'du-lich': 'du lịch', 'thi': 'thi cử' };
  let tag, title, detail, sample = null, tab, action = null;
  if (rec.length) {
    const r = rec[0];
    tag = 'LỖI LẶP LẠI'; title = `Lỗi này xuất hiện ${r.c} lần`;
    detail = `“${r.pattern.slice(0, 70)}” — sửa ngay để không lặp nữa.`; tab = 'vocab'; action = 'mistakes';
    sample = findMistakeCorrect(r.pattern);
  } else if (due > 0) {
    tag = 'ÔN TẬP ĐÚNG LÚC'; title = `Ôn ${due} cụm sắp quên`;
    detail = 'Theo lịch SRS — ôn đúng thời điểm để nhớ lâu hơn.'; tab = 'vocab'; action = 'review';
    sample = dueItems(lang, 1)[0]?.item?.example || null;
  } else if (pl && pl.weakest) {
    const map = { listening: 'listening', reading: 'reading', speaking: 'speaking' };
    tag = 'ĐIỂM YẾU CẦN ƯU TIÊN'; title = `Luyện ${skillLabel(pl.weakest)}`;
    detail = `Placement cho thấy ${skillLabel(pl.weakest)} thấp nhất (Level ${pl.level}).`; tab = map[pl.weakest] || 'listening'; action = null;
  } else {
    tag = 'KHỞI ĐẦU HÔM NAY';
    title = goals.length ? 'Học từ mới hướng tới mục tiêu của bạn' : 'Đặt mục tiêu để cô giáo dẫn dắt';
    detail = goals.length ? `Mục tiêu: ${goals.map((g) => glabel[g] || g).join(', ')}.` : 'Chọn mục tiêu + làm test đầu vào để có kế hoạch đúng.';
    tab = goals.length ? 'vocab' : 'setup'; action = goals.length ? 'learn' : null;
  }
  return { tag, title, detail, sample, tab, action };
}

function renderCoach() {
  const c = buildCoach();
  $('#coachTag').textContent = c.tag;
  $('#coachTitle').textContent = c.title;
  $('#coachDetail').textContent = c.detail;
  const sampleEl = $('#coachSample');
  if (c.sample) { sampleEl.textContent = `Nghe ví dụ: “${c.sample}”`; sampleEl.hidden = false; }
  else sampleEl.hidden = true;
  $('#coachGo').onclick = () => {
    window.switchTab(c.tab);
    if (c.action === 'learn') startLearn();
  };
  $('#coachListen').onclick = () => {
    if (c.sample) LV.playText(c.sample, LV.language, { announceFallback: false });
    else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(`${c.title}. ${c.detail}`);
      u.lang = 'vi-VN'; u.rate = 0.95;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }
  };
}

function nextBestAction() {
  const lang = LV.language;
  if (hasUnfinishedSession()) {
    return { title: 'Tiếp tục bài đang dở', reason: 'Bạn chưa học xong phiên trước — bấm để học tiếp ngay.', tab: 'vocab', action: 'resume' };
  }
  const rec = recurringMistakes();
  if (rec.length) return { title: `Sửa lỗi lặp lại: “${rec[0].pattern.slice(0, 40)}”`, reason: `Lỗi này xuất hiện ${rec[0].c} lần, nên xử lý ngay.`, tab: 'vocab', action: 'mistakes' };
  const due = dueItems(lang, 99).length;
  const pending = store.mistakes.filter((m) => m.lang === lang && m.status === 'new').length;
  if (due > 0) return { title: `Ôn ${due} từ sắp quên`, reason: 'Theo lịch SRS — ôn đúng lúc để nhớ lâu.', tab: 'vocab', action: 'review' };
  if (pending > 0) return { title: `Sửa ${pending} lỗi cần xử lý`, reason: 'Từ error notebook — sửa lỗi để không lặp lại.', tab: 'vocab', action: 'mistakes' };
  const pl = store.profile.placement?.[lang];
  if (pl && pl.weakest) {
    const map = { listening: 'listening', reading: 'reading', speaking: 'speaking' };
    const tab = map[pl.weakest] || 'listening';
    return { title: `Bài hôm nay: luyện ${skillLabel(pl.weakest)}`, reason: `Điểm yếu nhất của bạn (${pl.skills?.[pl.weakest]}%) — học đúng chỗ cần cải thiện.`, tab, action: pl.weakest === 'reading' ? 'reading' : pl.weakest === 'listening' ? 'listening' : 'speaking' };
  }
  // Luôn có một bài cụ thể để bắt đầu ngay, kể cả khi chưa thiết lập
  const mode = normalizeLearnerMode(store.profile.ageGroup);
  const starters = {
    preschool: { title: 'Nghe và nói 3 câu đầu tiên', reason: 'Một hoạt động ngắn, rõ âm và có thể học cùng người lớn.', tab: 'listening', action: 'listening' },
    child: { title: 'Chinh phục 3 từ hôm nay', reason: 'Bắt đầu bằng một thử thách vừa sức và nhận phản hồi ngay.', tab: 'vocab', action: 'learn' },
    teen: { title: 'Bài hôm nay: nghe và phản xạ', reason: 'Xây phản xạ thật để hỗ trợ cả giao tiếp và thi cử.', tab: 'listening', action: 'listening' },
    'young-adult': { title: 'Học 3 cụm dùng được ngay', reason: 'Ưu tiên cụm từ thực tế cho học tập, công việc và giao tiếp.', tab: 'vocab', action: 'learn' }
  };
  return starters[mode];
}

// Bắt đầu một hoạt động cụ thể — không bao giờ dead-end
function startActivity(tab, action) {
  switchTab(tab);
  if (action === 'review') vsStartReview();
  else if (action === 'learn') vsStartLearn();
  else if (action === 'mistakes') vsShowView('mistakes');
  else if (action === 'reading') openFirstRead();
  else if (action === 'setup') { switchTab('setup'); const el = document.getElementById('tab-setup'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (action === 'resume') resumeSession();
  // listening/speaking/writing: switchTab đã render sẵn hoạt động (listening tự khởi tạo)
}
function openFirstRead() {
  const first = document.querySelector('#readList li');
  if (first) first.click();
}
function renderOnboardGuide() {
  const g = document.getElementById('onboardGuide');
  if (!g) return;
  g.hidden = !!store.profile.startedAt;
}

/* ---- Onboarding 3 bước (lần đầu) ---- */
let wgStep = 1;
function wgShowStep(n) {
  wgStep = n;
  ['wgStep1', 'wgStep2', 'wgStep3'].forEach((id) => { const el = document.getElementById(id); if (el) el.hidden = id !== 'wgStep' + n; });
  const bar = document.getElementById('wgBar');
  if (bar) bar.style.width = `${(n / 3) * 100}%`;
  const modal = document.getElementById('onboardModal');
  if (modal?.getAttribute('aria-hidden') === 'false') {
    requestAnimationFrame(() => document.querySelector(`#wgStep${n} h2`)?.focus());
  }
}
function maybeStartOnboarding() {
  if (store.profile.startedAt) return;
  try { if (localStorage.getItem('lv-onboarded')) return; } catch {}
  wgShowStep(1);
  openModal(document.getElementById('onboardModal'), '#onboardName');
}
function wgSaveProfile() {
  const p = store.profile;
  p.displayName = cleanDisplayName(document.getElementById('onboardName')?.value) || p.displayName || '';
  p.goals = [...document.querySelectorAll('#onboardModal input[type="checkbox"]:checked:not(:disabled)')].slice(0, 2).map((c) => c.value);
  p.dailyMinutes = Number(document.querySelector('#wgMin button.active')?.dataset.min || 25);
  updateJourneyStage(p, selectedLearnerMode('onboardAgePicker'));
  p.splitEn = p.splitEn || 60;
  if (!p.startedAt) p.startedAt = localDateKey();
  store.profile = p;
  applyLearnerMode(p.ageGroup);
  syncMemory();
  renderPlan();
}
function wgRenderPlaceResult() {
  const box = document.getElementById('wgPlaceResult');
  if (!box) return;
  box.replaceChildren();
  const pl = store.profile.placement || {};
  for (const lang of ['en', 'zh']) {
    if (!pl[lang]) continue;
    const r = document.createElement('div'); r.className = 'place-result';
    r.textContent = `${lang.toUpperCase()}: Level ${pl[lang].level} · tổng ${pl[lang].overall}/100 · yếu nhất: ${skillLabel(pl[lang].weakest)}`;
    box.append(r);
  }
}
function wgShowSummary() {
  const p = store.profile;
  const goals = (p.goals || []).map((g) => ({ 'giao-tiep': 'Giao tiếp', 'cong-viec': 'Công việc', 'du-lich': 'Du lịch', 'thi': 'Thi cử' }[g] || g)).join(', ') || 'chưa chọn';
  const en = p.placement?.en ? `EN Level ${p.placement.en.level}` : 'EN chưa test';
  const zh = p.placement?.zh ? `ZH Level ${p.placement.zh.level}` : 'ZH chưa test';
  document.getElementById('wgSummary').textContent = `${learnerDisplayName()} · ${LEARNER_MODES[normalizeLearnerMode(p.ageGroup)].stage} (${LEARNER_MODES[normalizeLearnerMode(p.ageGroup)].label}) · Mục tiêu: ${goals} · ${p.dailyMinutes} phút/ngày · ${en} · ${zh}. Hồ sơ này sẽ tiếp tục đồng hành ở các giai đoạn sau.`;
}
function wgFinish() {
  wgSaveProfile();
  try { localStorage.setItem('lv-onboarded', '1'); } catch {}
  closeModal(document.getElementById('onboardModal'));
  switchTab('vocab');
  vsStartLearn();
  LV.toast('Chào mừng! Bắt đầu với 3 từ mới đầu tiên.');
}
function renderPlan() {
  const day = dayOf();
  const ph = phaseOf();
  const greet = document.getElementById('greetDay');
  if (greet) greet.textContent = `Ngày ${day} / 90 · Chặng ${PHASES[ph].name}`;
  const heroEyebrow = document.getElementById('heroEyebrow');
  const learnerMode = LEARNER_MODES[normalizeLearnerMode(store.profile.ageGroup)];
  if (heroEyebrow) heroEyebrow.textContent = `${learnerDisplayName().toLocaleUpperCase('vi-VN')} · ${learnerMode.stage.toLocaleUpperCase('vi-VN')} · HỌC ĐỂ DÙNG`;
  renderJourneyIdentity();
  const dayEl = $('#planDay');
  if (dayEl) dayEl.textContent = `Ngày ${day} / 90`;
  const phEl = $('#planPhase');
  if (phEl) phEl.textContent = `Chặng: ${PHASES[ph].name}`;

  const nb = nextBestAction();
  $('#planNextTitle').textContent = nb.title;
  $('#planNextReason').textContent = nb.reason || '';
  $('#planNextGo').onclick = () => startActivity(nb.tab, nb.action);

  // Checklist hôm nay: mỗi mục có "Bắt đầu" route đúng hoạt động + vòng check đánh dấu xong
  const stack = $('#planStack');
  stack.replaceChildren();
  const langLabel = LV.LANG_LABEL[LV.language];
  const h = document.createElement('li');
  h.innerHTML = `<strong>${langLabel}</strong> <small>theo tỷ lệ ${store.profile.splitEn || 60}/${100 - (store.profile.splitEn || 60)}</small>`;
  h.classList.add('lang-row');
  stack.append(h);
  const todayKey = `d${day}`;
  const doneMap = (store.profile.todayDone && store.profile.todayDone[todayKey]) || {};
  const toggleDone = (i) => {
    const p = store.profile;
    p.todayDone = p.todayDone || {};
    p.todayDone[todayKey] = p.todayDone[todayKey] || {};
    p.todayDone[todayKey][i] = !p.todayDone[todayKey][i];
    store.profile = p;
    renderPlan();
  };
  buildDailyStack().forEach((b, i) => {
    const li = document.createElement('li');
    li.className = 'check-row' + (doneMap[i] ? ' done' : '');
    const circle = document.createElement('button');
    circle.type = 'button';
    circle.className = 'check-circle';
    circle.setAttribute('aria-label', doneMap[i] ? 'Bỏ đánh dấu đã làm' : 'Đánh dấu đã làm');
    circle.setAttribute('aria-pressed', String(Boolean(doneMap[i])));
    circle.textContent = doneMap[i] ? '✓' : '';
    circle.addEventListener('click', (e) => { e.stopPropagation(); toggleDone(i); });
    const label = document.createElement('span');
    label.className = 'check-label';
    label.innerHTML = `<b>${b.title}</b> <small>· ${b.minutes} phút — ${b.desc}</small>`;
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'text-btn check-go';
    go.textContent = 'Bắt đầu →';
    go.addEventListener('click', (e) => { e.stopPropagation(); startActivity(b.tab, b.action); });
    li.append(circle, label, go);
    stack.append(li);
  });

  // Roadmap progress bar (thu gọn)
  const bar = document.getElementById('roadmapBar');
  if (bar) {
    bar.replaceChildren();
    PHASES.forEach((pInfo, i) => {
      const seg = document.createElement('i');
      seg.className = i < ph ? 'done' : i === ph ? 'current' : '';
      bar.append(seg);
    });
  }
  const labels = document.getElementById('roadmapLabels');
  if (labels) {
    labels.textContent = `${PHASES[0].name} · ${PHASES[1].name} · ${PHASES[2].name}`;
  }

  renderHeroStats();
  renderCoach();
  renderOnboardGuide();
  renderHabits();
}

function renderPath() {
  const day = dayOf();
  const ph = phaseOf();
  const phEl = document.getElementById('planPhasePath');
  if (phEl) phEl.textContent = `Chặng: ${PHASES[ph].name}`;
  const sum = document.getElementById('pathSummary');
  if (sum) {
    const pl = store.profile.placement;
    sum.textContent = `Bạn đang ở ngày ${day}/90. ` + (pl?.en ? `English Level ${pl.en.level}` : 'English chưa test') + (pl?.zh ? ` · 中文 Level ${pl.zh.level}` : ' · 中文 chưa test') + '. Hoàn thành checkpoint từng chặng để mở bằng chứng tiến bộ.';
  }
  const road = $('#planRoadmap');
  road.replaceChildren();
  PHASES.forEach((phInfo, i) => {
    const st = document.createElement('div'); st.className = 'road-step' + (i < ph ? ' done' : i === ph ? ' current' : '');
    const b = document.createElement('b'); b.textContent = `Chặng ${i + 1} · ${phInfo.name} (ngày ${phInfo.days})`;
    const s = document.createElement('span'); s.textContent = phInfo.focus + ' · Checkpoint: ' + phInfo.checkpoint;
    st.append(b, s);
    road.append(st);
  });
  renderCefr();
}

/* ---- Đà học tập & báo cáo tuần ---- */
function loadDays() {
  try { return JSON.parse(localStorage.getItem('lv-days') || '{}'); } catch { return {}; }
}
function saveDays(d) { try { localStorage.setItem('lv-days', JSON.stringify(d)); } catch {} }
function todayKey() { return localDateKey(); }
function recordActivity(minutes, words) {
  const d = loadDays();
  const k = todayKey();
  d[k] = { minutes: (d[k]?.minutes || 0) + (minutes || 0), words: (d[k]?.words || 0) + (words || 0) };
  saveDays(d);
  renderHabits();
  // Gamification: đẩy rollup phút/từ lên server (fire-and-forget, debounce trong lv-shell)
  if (window.LVShell) window.LVShell.logActivity({ minutes: minutes || 0, words: words || 0 });
}
// app.js gọi qua window.* trong try/catch — trước đây chưa export nên luồng quiz no-op thầm
window.srsRecord = srsRecord;
window.recordActivity = recordActivity;
function habitStats() {
  const d = loadDays();
  const today = d[todayKey()];
  const todayMin = today?.minutes || 0;
  const wordsWeek = Object.entries(d).filter(([date]) => Date.now() - new Date(date + 'T00:00:00') < 7 * 86400000).reduce((a, [, v]) => a + (v.words || 0), 0);
  // streak: đếm liên tiếp từ hôm nay (nếu hôm nay chưa học vẫn tính nếu hôm qua có)
  let streak = 0;
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  if (!d[todayKey()]) cursor.setDate(cursor.getDate() - 1); // cho phép hôm nay chưa học
  while (d[toKey(cursor)]) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  // số ngày nghỉ liên tiếp: đếm các ngày trống từ hôm qua trở về (hôm nay chưa học không tính là nghỉ)
  let missed = 0;
  const mc = new Date(); mc.setHours(0, 0, 0, 0);
  if (!d[toKey(mc)]) {
    mc.setDate(mc.getDate() - 1);
    while (!d[toKey(mc)]) { missed += 1; mc.setDate(mc.getDate() - 1); if (missed > 90) break; }
  }
  // 7 ngày gần nhất (minutes)
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(); dt.setHours(0, 0, 0, 0); dt.setDate(dt.getDate() - i);
    week.push({ key: toKey(dt), minutes: d[toKey(dt)]?.minutes || 0 });
  }
  return { streak, todayMin, wordsWeek, missed, week };
}
function toKey(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
function renderHabits() {
  // Đã đăng nhập: số từ server (lv-shell) là nguồn chuẩn — tránh nhảy ngược về số local cũ
  const h = (window.LVShell && window.LVShell.habitStats && window.LVShell.habitStats()) || habitStats();
  const goal = store.profile.dailyMinutes || 25;
  const sEl = document.getElementById('habitStreak');
  if (sEl) sEl.textContent = `${h.streak} ngày liên tiếp`;
  const tm = document.getElementById('habitTodayMin');
  if (tm) tm.textContent = h.todayMin;
  const tg = document.getElementById('habitTodayGoal');
  if (tg) tg.textContent = `phút hôm nay / ${goal}`;
  const ww = document.getElementById('habitWordsWeek');
  if (ww) ww.textContent = h.wordsWeek;
  const mi = document.getElementById('habitMissed');
  if (mi) mi.textContent = h.missed;
  const bars = document.getElementById('habitWeek');
  if (bars) {
    bars.replaceChildren();
    const max = Math.max(12, ...h.week.map((w) => w.minutes));
    h.week.forEach((w, i) => {
      const col = document.createElement('i');
      col.style.height = `${Math.max(6, Math.round((w.minutes / max) * 60))}px`;
      if (i === 6) col.classList.add('today'); else if (w.minutes > 0) col.classList.add('done');
      const lab = document.createElement('span'); lab.textContent = i === 6 ? 'Hôm nay' : `${i === 5 ? 'Hqua' : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'][i] || ''}`;
      col.append(lab);
      bars.append(col);
    });
  }
  const note = document.getElementById('habitNote');
  if (note) {
    if (h.missed >= 2) note.textContent = `Đã ${h.missed} ngày chưa học — quay lại với 5 phút nhé, streak của bạn vẫn chờ!`;
    else if (h.missed === 1) note.textContent = 'Hôm qua bạn chưa học. 5 phút hôm nay là đủ để giữ đà!';
    else if (h.todayMin < goal) note.textContent = `Hôm nay đã học ${h.todayMin}/${goal} phút. Còn ${Math.max(0, goal - h.todayMin)} phút nữa là đủ mục tiêu.`;
    else note.textContent = 'Đủ mục tiêu hôm nay rồi — tuyệt vời!';
  }
}

/* ---- Lộ trình CEFR tham chiếu: mốc từ vựng + năng lực cần học ---- */
const CEFR = [
  {
    code: 'A1', name: 'Sơ cấp', words: 500, desc: 'Xây nền để giao tiếp bằng câu rất ngắn.',
    topics: ['Chào hỏi và giới thiệu bản thân', 'Số, giờ, ngày tháng và gia đình', 'Ăn uống, địa điểm và nhu cầu cơ bản'],
    structures: ['Động từ be, have và hiện tại đơn', 'Đại từ, mạo từ và danh từ số nhiều', 'Câu hỏi What / Where / When / How'],
    skills: ['Nghe câu chậm và nhận ra từ khóa', 'Đọc biển báo, tin nhắn rất ngắn', 'Nói/viết 3–5 câu về bản thân'],
    outcome: 'Tự giới thiệu và xử lý một nhu cầu cơ bản bằng câu mẫu.'
  },
  {
    code: 'A2', name: 'Tiểu trung cấp', words: 1500, desc: 'Xử lý các tình huống quen thuộc hằng ngày.',
    topics: ['Mua sắm, du lịch và phương tiện', 'Nhà cửa, sức khỏe và lịch hẹn', 'Email ngắn và cuộc gọi đơn giản'],
    structures: ['Quá khứ đơn và tương lai gần', 'So sánh hơn, lượng từ và trạng từ tần suất', 'Can / should / have to cho nhu cầu và lời khuyên'],
    skills: ['Nghe hội thoại ngắn ở tốc độ rõ', 'Đọc email và hướng dẫn đơn giản', 'Trao đổi 1–2 phút về chủ đề quen thuộc'],
    outcome: 'Hoàn thành một giao dịch quen thuộc và viết tin nhắn ngắn rõ ý.'
  },
  {
    code: 'B1', name: 'Trung cấp', words: 2500, desc: 'Giao tiếp độc lập trong đời sống và công việc quen thuộc.',
    topics: ['Họp, email, dự án và kế hoạch', 'Kinh nghiệm, ý kiến và mục tiêu cá nhân', 'Tin tức, học tập và du lịch tự túc'],
    structures: ['Hiện tại hoàn thành và các thì kể chuyện', 'Câu điều kiện cơ bản và mệnh đề quan hệ', 'Liên từ để giải thích nguyên nhân, kết quả'],
    skills: ['Nắm ý chính của nội dung 2–3 phút', 'Đọc và tóm tắt văn bản 150–250 từ', 'Trình bày ý kiến có lý do trong 3–5 phút'],
    outcome: 'Duy trì hội thoại, giải thích kế hoạch và xử lý email công việc thông thường.'
  },
  {
    code: 'B2', name: 'Trung cao cấp', words: 5000, desc: 'Giao tiếp tự tin với nội dung phức tạp và chuyên nghiệp hơn.',
    topics: ['Thuyết trình, phỏng vấn và báo cáo', 'Vấn đề xã hội, lựa chọn và quan điểm', 'Khách hàng, rủi ro và tiến độ dự án'],
    structures: ['Câu bị động và lời nói gián tiếp', 'Câu điều kiện nâng cao và động từ khuyết thiếu', 'Từ nối học thuật và cấu trúc nhấn mạnh'],
    skills: ['Theo dõi ý chính ở tốc độ gần tự nhiên', 'Đọc bài phân tích và nhận ra lập luận', 'Bảo vệ quan điểm, hỏi lại và làm rõ ý'],
    outcome: 'Thuyết trình hoặc phỏng vấn 5–7 phút với lập luận rõ và ít hỗ trợ.'
  },
  {
    code: 'C1', name: 'Cao cấp', words: 8000, desc: 'Sử dụng ngôn ngữ linh hoạt trong học thuật và công việc.',
    topics: ['Đàm phán, thuyết phục và chiến lược', 'Tài liệu chuyên ngành và nghiên cứu', 'Sắc thái văn hóa, thái độ và hàm ý'],
    structures: ['Cấu trúc phức, đảo ngữ và rút gọn', 'Register trang trọng, trung tính và thân mật', 'Collocation nâng cao và cách diễn đạt sắc thái'],
    skills: ['Tổng hợp ý từ nhiều nguồn dài', 'Viết báo cáo có cấu trúc và giọng phù hợp', 'Điều chỉnh cách nói theo người nghe và mục tiêu'],
    outcome: 'Điều hành trao đổi chuyên sâu hoặc trình bày 8–10 phút một cách linh hoạt.'
  },
  {
    code: 'C2', name: 'Thành thạo', words: 16000, desc: 'Diễn đạt chính xác, tự nhiên trong hầu hết bối cảnh.',
    topics: ['Thành ngữ, ẩn dụ và hàm ý tinh tế', 'Lập luận chuyên sâu và khác biệt quan điểm', 'Ngôn ngữ ngành nghề và phong cách cá nhân'],
    structures: ['Kiểm soát sắc thái và độ trang trọng', 'Biến đổi cấu trúc để tạo nhịp và trọng tâm', 'Collocation, idiom và cách nói ít phổ biến'],
    skills: ['Hiểu nội dung dài dù tốc độ và giọng đa dạng', 'Tóm lược chính xác nhiều nguồn mâu thuẫn', 'Ứng biến và diễn đạt ý tinh tế gần như không cần hỗ trợ'],
    outcome: 'Thích ứng chính xác với bối cảnh, người nghe và mục đích giao tiếp phức tạp.'
  }
];
function learnedEnglishWords() {
  const s = store.srs.items.en || {};
  return Object.values(s).filter((it) => it.state === 'review' || it.state === 'mastered').length;
}
function nextCefr(n) { return CEFR.find((l) => n < l.words) || null; }

function cefrLearningColumn(title, items) {
  const column = document.createElement('section'); column.className = 'cefr-learning-column';
  const heading = document.createElement('h4'); heading.textContent = title;
  const list = document.createElement('ul');
  items.forEach((item) => { const li = document.createElement('li'); li.textContent = item; list.append(li); });
  column.append(heading, list); return column;
}

function openCefrVocabulary(level) {
  switchTab('vocab');
  vsShowView('bank');
  document.getElementById('vsLangFilter').value = 'en';
  document.getElementById('vsCefrFilter').value = level;
  vsFillTopicFilter(); renderVsBank();
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('vs-bank').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function renderCefr() {
  const box = document.getElementById('cefrList');
  if (!box) return;
  const n = learnedEnglishWords();
  const dataCoverage = vocabCoverage('en');
  box.replaceChildren();
  const next = nextCefr(n);
  const sum = document.getElementById('cefrSummary');
  if (sum) {
    sum.innerHTML = next
      ? `Bạn đã học <b>${n.toLocaleString('vi')} từ tiếng Anh</b>. Còn khoảng <b>${(next.words - n).toLocaleString('vi')} từ</b> để đủ mốc từ vựng tham chiếu <b>${next.code}</b>. Năng lực thực tế còn dựa trên nghe, đọc, viết và nói.`
      : `Bạn đã học <b>${n.toLocaleString('vi')} từ tiếng Anh</b> và đủ mốc từ vựng tham chiếu cao nhất. Năng lực thực tế vẫn được đánh giá qua các checkpoint kỹ năng.`;
  }
  CEFR.forEach((l) => {
    const isDone = n >= l.words; const isCurrent = !isDone && next && next.code === l.code;
    const row = document.createElement('article');
    row.className = 'cefr-row' + (isDone ? ' done' : isCurrent ? ' current' : '');
    row.setAttribute('aria-label', `${l.code} ${l.name}: nội dung cần học`);
    const pct = Math.min(100, Math.round((n / l.words) * 100));
    const head = document.createElement('div'); head.className = 'cefr-head';
    const titleWrap = document.createElement('div'); titleWrap.className = 'cefr-title';
    const title = document.createElement('h3'); title.textContent = `${l.code} · ${l.name}`;
    const status = document.createElement('span'); status.className = 'cefr-status';
    status.textContent = isDone ? 'Đủ mốc từ' : isCurrent ? 'Đang học' : 'Tiếp theo';
    titleWrap.append(title, status);
    const available = dataCoverage.levels[l.code] || 0;
    const wordTarget = document.createElement('span'); wordTarget.className = 'cefr-word-target';
    wordTarget.textContent = dataCoverage.status === 'loading' ? 'Đang nạp dữ liệu' : `Kho có ${available} · mốc ~${l.words.toLocaleString('vi')} từ`;
    head.append(titleWrap, wordTarget);
    const overview = document.createElement('p'); overview.className = 'cefr-overview'; overview.textContent = l.desc;
    const bar = document.createElement('div'); bar.className = 'cefr-bar'; bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', `Tiến độ mốc từ vựng ${l.code}`); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(pct));
    const fill = document.createElement('i'); fill.style.width = `${pct}%`; bar.append(fill);
    const learning = document.createElement('div'); learning.className = 'cefr-learning-grid';
    learning.append(cefrLearningColumn('Chủ đề & từ vựng', l.topics), cefrLearningColumn('Cấu trúc trọng tâm', l.structures), cefrLearningColumn('Kỹ năng cần làm', l.skills));
    const outcome = document.createElement('div'); outcome.className = 'cefr-outcome';
    const outcomeLabel = document.createElement('strong'); outcomeLabel.textContent = 'Đầu ra cần đạt';
    const outcomeText = document.createElement('span'); outcomeText.textContent = l.outcome;
    outcome.append(outcomeLabel, outcomeText);
    const dataAction = document.createElement('div'); dataAction.className = 'cefr-data-action';
    if (available > 0) {
      const view = document.createElement('button'); view.type = 'button'; view.className = 'text-btn';
      view.textContent = `Xem ${available} từ ${l.code} đang có`;
      view.addEventListener('click', () => openCefrVocabulary(l.code)); dataAction.append(view);
    } else {
      const missing = document.createElement('span'); missing.textContent = dataCoverage.status === 'loading' ? 'Đang kiểm tra kho từ…' : `Chưa có dữ liệu từ ${l.code}`;
      dataAction.append(missing);
    }
    row.append(head, overview, bar, learning, outcome, dataAction);
    box.append(row);
  });
  const wnote = document.getElementById('cefrWorkplace');
  if (wnote) {
    wnote.textContent = 'CEFR ở đây là khung tham chiếu học tập, không phải chứng chỉ. Lộ trình ưu tiên từ tần suất cao và tình huống công việc như họp, email, phỏng vấn, thuyết trình, đàm phán.';
  }
}
function renderHeroStats() {
  const lang = LV.language;
  const s = store.srs.items[lang] || {};
  const learned = Object.values(s).filter((i) => i.state === 'review' || i.state === 'mastered').length;
  const mistakes = store.mistakes.filter((m) => m.lang === lang && m.status === 'new').length;
  const pl = store.profile.placement?.[lang];
  const levelTxt = pl ? `Level ${pl.level}` : 'chưa test';
  $('#heroProgress').innerHTML = `
    <div class="stat"><b>${learned}</b><span>cụm đã học</span></div>
    <div class="stat"><b>${mistakes}</b><span>lỗi cần sửa</span></div>
    <div class="stat"><b>${levelTxt}</b><span>trình độ</span></div>`;
}

/* ================= SETUP & PLACEMENT ================= */
function loadProfileUI() {
  const p = store.profile;
  applyLearnerMode(p.ageGroup);
  const profileName = document.getElementById('profileName');
  const onboardName = document.getElementById('onboardName');
  if (profileName) profileName.value = p.displayName || '';
  if (onboardName) onboardName.value = p.displayName || '';
  (p.goals || []).forEach((g) => { const el = document.getElementById('goal-' + g); if (el) el.checked = true; });
  document.querySelectorAll('#minutesSeg button').forEach((b) => b.classList.toggle('active', Number(b.dataset.min) === p.dailyMinutes));
  $('#splitEn').value = p.splitEn || 60;
  $('#splitLabel').textContent = `English ${p.splitEn || 60}% · 中文 ${100 - (p.splitEn || 60)}%`;
  renderProfileSummary();
  loadTeacherCustomization();
}

const TEACHER_PERSONALITY_LABEL = { warm: 'Ấm áp', strict: 'Kỷ luật', energetic: 'Năng lượng' };
let teacherVoiceOptions = null;

function friendlyVoiceLabel(id, index, lang) {
  const known = {
    F1: 'Nữ 1 · trong trẻo', F2: 'Nữ 2 · ấm áp', F3: 'Nữ 3 · rõ ràng', F4: 'Nữ 4 · tự nhiên', F5: 'Nữ 5 · nhẹ nhàng',
    M1: 'Nam 1 · trầm', M2: 'Nam 2 · rõ ràng', M3: 'Nam 3 · tự nhiên', M4: 'Nam 4 · năng lượng', M5: 'Nam 5 · ấm áp',
    af_bella: 'Bella · nữ tự nhiên', af_heather: 'Heather · nữ nhẹ nhàng',
    zf_xiaobei: 'Xiaobei · nữ ấm áp', zf_xiaoni: 'Xiaoni · nữ trẻ trung', zf_xiaoxiao: 'Xiaoxiao · nữ tự nhiên', zf_xiaoyi: 'Xiaoyi · nữ rõ ràng',
    zm_yunjian: 'Yunjian · nam trầm', zm_yunxi: 'Yunxi · nam trẻ trung', zm_yunxia: 'Yunxia · nam tự nhiên', zm_yunyang: 'Yunyang · nam rõ ràng'
  };
  if (known[id]) return known[id];
  const style = String(id).match(/^supertonic-style:English\/(Female|Male)\/([^()]+?)(?:\s*\(|$)/);
  if (style) return `${style[2].trim()} · ${style[1] === 'Female' ? 'nữ' : 'nam'} tự nhiên`;
  return `${lang === 'zh' ? '中文' : 'English'} ${index + 1}`;
}

function curateTeacherVoices(voices, lang) {
  if (lang === 'zh') return voices.filter((voice) => /^(?:zf|zm)_/.test(voice)).slice(0, 12);
  const simpleOrder = ['F1', 'F2', 'F4', 'F5', 'M1', 'M2', 'M3', 'M5'];
  const simple = simpleOrder.filter((voice) => voices.includes(voice));
  const featuredNames = ['/Abigail ', '/Emma ', '/Chloe ', '/Henry ', '/Oliver ', '/Sophia '];
  const featured = featuredNames.map((name) => voices.find((voice) => voice.includes('supertonic-style:English/') && voice.includes(name))).filter(Boolean);
  const fallback = voices.filter((voice) => /^[FM]\d+$/.test(voice));
  const curated = [...new Set([...simple, ...featured, ...fallback])].slice(0, 14);
  return curated.length ? curated : voices.slice(0, 12);
}

function applyTeacherProfileUI(profile) {
  const label = TEACHER_PERSONALITY_LABEL[profile.personality] || TEACHER_PERSONALITY_LABEL.warm;
  const meta = document.getElementById('teacherMeta');
  if (meta) meta.textContent = `Giáo viên · ${label}`;
}

function renderTeacherVoiceSelect(lang, data, selected) {
  const select = document.getElementById(lang === 'zh' ? 'teacherVoiceZh' : 'teacherVoiceEn');
  if (!select) return;
  select.replaceChildren();
  const allVoices = Array.isArray(data?.voices) ? data.voices : [];
  const voices = curateTeacherVoices(allVoices, lang);
  if (!voices.length) {
    const option = document.createElement('option'); option.value = ''; option.textContent = 'Giọng mặc định';
    select.append(option); select.disabled = true; return;
  }
  voices.forEach((voice, index) => {
    const option = document.createElement('option'); option.value = voice;
    option.textContent = friendlyVoiceLabel(voice, index, lang);
    select.append(option);
  });
  const requested = selected && voices.includes(selected) ? selected : data.defaultVoice;
  select.value = requested && voices.includes(requested) ? requested : voices[0];
  select.disabled = false;
}

async function loadTeacherCustomization() {
  const profile = LV.getTeacherProfile();
  const radio = document.querySelector(`input[name="teacherPersonality"][value="${profile.personality}"]`);
  if (radio) radio.checked = true;
  const speed = document.getElementById('teacherSpeed');
  if (speed) speed.value = String(profile.speed);
  const speedValue = document.getElementById('teacherSpeedValue');
  if (speedValue) speedValue.textContent = `${profile.speed.toFixed(2)}×`;
  applyTeacherProfileUI(profile);
  try {
    if (!teacherVoiceOptions) {
      const response = await fetch('/api/voice/options');
      if (!response.ok) throw new Error('voice options unavailable');
      teacherVoiceOptions = (await response.json()).languages;
    }
    renderTeacherVoiceSelect('en', teacherVoiceOptions?.en, profile.voices.en);
    renderTeacherVoiceSelect('zh', teacherVoiceOptions?.zh, profile.voices.zh);
  } catch {
    renderTeacherVoiceSelect('en', null, profile.voices.en);
    renderTeacherVoiceSelect('zh', null, profile.voices.zh);
  }
}

function teacherProfileFromUI() {
  return {
    personality: document.querySelector('input[name="teacherPersonality"]:checked')?.value || 'warm',
    voices: {
      en: document.getElementById('teacherVoiceEn')?.value || null,
      zh: document.getElementById('teacherVoiceZh')?.value || null
    },
    speed: Number(document.getElementById('teacherSpeed')?.value || 0.95)
  };
}

function saveTeacherCustomization() {
  const profile = LV.saveTeacherProfile(teacherProfileFromUI());
  applyTeacherProfileUI(profile);
  const badge = document.getElementById('teacherSavedBadge');
  if (badge) { badge.classList.add('show'); clearTimeout(saveTeacherCustomization._t); saveTeacherCustomization._t = setTimeout(() => badge.classList.remove('show'), 1800); }
  try {
    fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patch: { teacherProfile: profile } }) }).catch(() => {});
  } catch {}
  LV.toast(`Đã lưu Cô Linh · ${TEACHER_PERSONALITY_LABEL[profile.personality]}.`);
}

async function previewTeacherVoice() {
  const draft = teacherProfileFromUI();
  const lang = LV.language;
  const text = lang === 'zh' ? '你好！我们一起练习中文吧。' : 'Hello! Let us practice English together.';
  const button = document.getElementById('teacherVoicePreview');
  button.disabled = true; button.textContent = 'Đang phát…';
  LV.setCoLinhState('speaking', 'Cô đang đọc thử giọng bạn chọn…');
  try { await LV.playText(text, lang, { voice: draft.voices[lang] || undefined, speed: draft.speed, announceFallback: false }); }
  finally { button.disabled = false; button.textContent = 'Nghe thử giọng'; LV.setCoLinhState('idle', 'Bạn có thể đổi giọng bất cứ lúc nào.'); }
}
function saveProfile() {
  const p = store.profile;
  p.displayName = cleanDisplayName(document.getElementById('profileName')?.value) || p.displayName || '';
  p.goals = [...document.querySelectorAll('#tab-setup input[type="checkbox"]:checked:not(:disabled)')].slice(0, 2).map((c) => c.value);
  p.dailyMinutes = Number(document.querySelector('#minutesSeg button.active')?.dataset.min || 25);
  updateJourneyStage(p, selectedLearnerMode('profileAgePicker'));
  p.splitEn = Number($('#splitEn').value);
  if (!p.startedAt) p.startedAt = localDateKey();
  store.profile = p;
  applyLearnerMode(p.ageGroup);
  LV.toast('Đã lưu hồ sơ học tập.');
  renderProfileSummary();
  renderPlan();
  syncMemory();
  renderMemory();
}
function renderProfileSummary() {
  const p = store.profile;
  const el = $('#profileSummary');
  const goals = (p.goals || []).length ? (p.goals || []).map((g) => ({ 'giao-tiep': 'Giao tiếp', 'cong-viec': 'Công việc', 'du-lich': 'Du lịch', 'thi': 'Thi cử' }[g] || g)).join(', ') : 'chưa chọn';
  const en = p.placement?.en ? `EN Level ${p.placement.en.level}` : 'EN chưa test';
  const zh = p.placement?.zh ? `ZH Level ${p.placement.zh.level}` : 'ZH chưa test';
  const strong = document.createElement('b');
  strong.textContent = `${learnerDisplayName()} · ${LEARNER_MODES[normalizeLearnerMode(p.ageGroup)].stage}: `;
  el.replaceChildren(strong, document.createTextNode(`${LEARNER_MODES[normalizeLearnerMode(p.ageGroup)].label} · ${p.dailyMinutes} phút/ngày · Mục tiêu: ${goals} · Tỷ lệ ${p.splitEn || 60}/${100 - (p.splitEn || 60)} · ${en} · ${zh}`));
  renderJourneyIdentity();
}

/* ---- Trí nhớ dài hạn của cô giáo ---- */
function collectMemoryPatch() {
  const p = store.profile;
  const progress = {};
  for (const lang of ['en', 'zh']) {
    const s = store.srs.items[lang] || {};
    const learned = Object.values(s).filter((i) => i.state === 'review' || i.state === 'mastered').length;
    const due = Object.values(s).filter((i) => i.state !== 'mastered' && (i.dueAt === null || i.dueAt <= Date.now())).length;
    const mistakes = store.mistakes.filter((m) => m.lang === lang && m.status === 'new').length;
    progress[lang] = { learned, due, mistakes };
  }
  const recentLearned = [];
  for (const lang of ['en', 'zh']) {
    const s = store.srs.items[lang] || {};
    for (const [id, it] of Object.entries(s)) {
      const v = findVocab(lang, id);
      if (v && (it.state === 'review' || it.state === 'mastered')) recentLearned.push({ term: v.term, meaning: v.meaning, lang });
    }
  }
  return {
    profile: { displayName: p.displayName, ageGroup: p.ageGroup, stageHistory: p.stageHistory, journeyStartedAt: p.journeyStartedAt, goals: p.goals, dailyMinutes: p.dailyMinutes, splitEn: p.splitEn, startedAt: p.startedAt },
    teacherProfile: LV.getTeacherProfile(),
    placement: p.placement,
    progress,
    weakSkills: { en: p.placement?.en?.weakest || null, zh: p.placement?.zh?.weakest || null },
    recentLearned: recentLearned.slice(0, 8),
    recentMistakes: store.mistakes.filter((m) => m.status === 'new').map((m) => ({ skill: m.skill, pattern: m.pattern, correct: m.correct, lang: m.lang })),
    day: dayOf()
  };
}
function syncMemory() {
  try {
    fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patch: collectMemoryPatch() }) }).catch(() => {});
  } catch {}
}
function addMemLine(container, label, value) {
  const line = document.createElement('div'); line.className = 'mem-line';
  const l = document.createElement('span'); l.className = 'mem-label'; l.textContent = label;
  const v = document.createElement('span'); v.textContent = value || '';
  line.append(l, v);
  container.append(line);
}
async function renderMemory() {
  try {
    const r = await fetch('/api/memory');
    const mem = await r.json();
    const v = $('#memoryView'); v.replaceChildren();
    if (!mem || !mem.profile) { v.textContent = '(chưa có bộ nhớ)'; return; }
    const goals = (mem.profile.goals || []).map((g) => ({ 'giao-tiep': 'Giao tiếp', 'cong-viec': 'Công việc', 'du-lich': 'Du lịch', 'thi': 'Thi cử' }[g] || g)).join(', ') || 'chưa đặt';
    addMemLine(v, 'Mục tiêu', goals);
    addMemLine(v, 'Lịch học', `${mem.profile.dailyMinutes || 25} phút/ngày · Anh/Trung ${mem.profile.splitEn || 60}/${100 - (mem.profile.splitEn || 60)}`);
    for (const lang of ['en', 'zh']) {
      const pl = mem.placement?.[lang];
      const pr = mem.progress?.[lang];
      addMemLine(v, lang.toUpperCase(), pl
        ? `Level ${pl.level} · yếu nhất: ${pl.weakest} · đã học ${pr?.learned || 0} cụm · ${pr?.due || 0} cần ôn · ${pr?.mistakes || 0} lỗi`
        : 'chưa làm placement');
    }
    if (mem.recentLearned?.length) addMemLine(v, 'Mới học', mem.recentLearned.slice(0, 4).map((x) => `“${x.term}”`).join(', '));
    if (mem.recentMistakes?.length) addMemLine(v, 'Lỗi gần đây', mem.recentMistakes.slice(0, 3).map((x) => x.pattern).join(' | '));
    (mem.notes || []).slice(-4).forEach((n) => {
      const d = document.createElement('div'); d.className = 'mem-note'; d.textContent = `Cô nhớ: ${n.text}`;
      v.append(d);
    });
  } catch {}
}

const placeState = { lang: 'en', questions: [], index: 0, answers: [] };
function startPlacement(lang) {
  placeState.lang = lang;
  placeState.answers = [];
  fetch('/api/placement/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: lang }) })
    .then((r) => r.json())
    .then((d) => {
      placeState.questions = d.questions;
      placeState.index = 0;
      openModal($('#placementModal'), '#placeClose');
      renderPlaceQuestion();
    })
    .catch(() => LV.toast('Không tải được bài test.'));
}
function renderPlaceQuestion() {
  const q = placeState.questions[placeState.index];
  $('#placeKind').textContent = `PLACEMENT · ${placeState.lang.toUpperCase()}`;
  $('#placeTitle').textContent = `Kiểm tra đầu vào ${placeState.lang === 'zh' ? '中文' : 'English'} — câu ${placeState.index + 1}/${placeState.questions.length}`;
  $('#placeProgress').style.width = `${((placeState.index + 1) / placeState.questions.length) * 100}%`;
  $('#placePrompt').textContent = q.prompt;
  $('#placeNotice').textContent = q.type === 'open' ? 'Viết câu trả lời (hoặc ghi âm — transcript chỉ sơ bộ).' : 'Chọn một đáp án.';
  const listen = $('#placeListen');
  listen.hidden = q.type !== 'listening';
  listen.onclick = () => LV.playText(q.audioText, placeState.lang, { announceFallback: false });
  const choices = $('#placeChoices');
  choices.replaceChildren();
  if (q.choices) q.choices.forEach((c, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.dataset.i = i;
    b.addEventListener('click', () => { choices.querySelectorAll('button').forEach((x) => x.classList.toggle('selected', x === b)); });
    choices.append(b);
  });
  choices.hidden = !q.choices;
  const open = $('#placeOpenAnswer');
  open.hidden = q.type !== 'open';
  open.value = '';
  $('#placeNext').textContent = placeState.index === placeState.questions.length - 1 ? 'Nộp bài' : 'Câu tiếp theo →';
}
async function placeNext() {
  const q = placeState.questions[placeState.index];
  let answer;
  if (q.type === 'open') answer = $('#placeOpenAnswer').value.trim();
  else answer = [...$('#placeChoices').querySelectorAll('button')].findIndex((b) => b.classList.contains('selected'));
  if (answer === -1 || answer === '') return LV.toast('Trả lời câu hỏi trước nhé.');
  placeState.answers.push({ id: q.id, answer });
  if (placeState.index < placeState.questions.length - 1) { placeState.index += 1; renderPlaceQuestion(); return; }
  $('#placeNext').disabled = true;
  try {
    const res = await fetch('/api/placement/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: placeState.lang, answers: placeState.answers }) });
    const score = await res.json();
    const p = store.profile;
    p.placement = p.placement || {};
    p.placement[placeState.lang] = score;
    store.profile = p;
    closeModal($('#placementModal'));
    $('#placeNext').disabled = false;
    renderPlaceResults();
    renderProfileSummary();
    renderPlan();
    syncMemory();
    renderMemory();
    wgRenderPlaceResult();
    LV.toast(`Xong! Level ước lượng ${score.level}.`);
  } catch { $('#placeNext').disabled = false; LV.toast('Không nộp được bài.'); }
}
function renderPlaceResults() {
  const box = $('#placeResults');
  box.replaceChildren();
  const pl = store.profile.placement || {};
  for (const lang of ['en', 'zh']) {
    if (!pl[lang]) continue;
    const r = document.createElement('div'); r.className = 'place-result';
    r.innerHTML = `<b>${lang.toUpperCase()}:</b> Level ${pl[lang].level} · tổng ${pl[lang].overall}/100 · yếu nhất: ${skillLabel(pl[lang].weakest)}`;
    box.append(r);
  }
}

/* ================= TABS & INIT ================= */
const SKILLS = ['vocab', 'writing', 'speaking', 'reading', 'listening', 'toeic'];
const modalOpeners = new WeakMap();

function modalFocusable(modal) {
  return [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.closest('[hidden], [aria-hidden="true"]'));
}

function openModal(modal, preferredFocus) {
  if (!modal) return;
  modalOpeners.set(modal, document.activeElement);
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    const target = (preferredFocus && modal.querySelector(preferredFocus)) || modalFocusable(modal)[0];
    target?.focus();
  });
}

function closeModal(modal) {
  if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
  modal.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal[aria-hidden="false"]')) document.body.classList.remove('modal-open');
  const opener = modalOpeners.get(modal);
  modalOpeners.delete(modal);
  if (opener && document.contains(opener)) opener.focus();
}

function handleModalKeydown(event) {
  const modal = event.currentTarget;
  if (modal.getAttribute('aria-hidden') === 'true') return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal(modal);
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = modalFocusable(modal);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function highlightNav(name) {
  // nav cấp cao: kỹ năng -> highlight "practice"
  const navName = SKILLS.includes(name) ? 'practice' : name;
  document.querySelectorAll('.main-tab').forEach((b) => {
    const on = b.dataset.tab === navName;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1; // roving tabindex
  });
  document.querySelectorAll('#bottomNav button').forEach((b) => {
    const on = b.dataset.tab === navName;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

function switchTab(name) {
  // "Cô Linh" là hành động mở giáo viên, không đổi panel
  if (name === 'coach') {
    document.body.classList.remove('teacher-settings');
    try { window.setTeacherOpen(true); } catch {}
    return;
  }
  // "Luyện tập" là hub -> mở kỹ năng đầu tiên (vocab)
  if (name === 'practice') name = 'vocab';
  if (name !== 'speaking') document.body.classList.remove('teacher-conversation');
  document.body.classList.toggle('teacher-settings', name === 'setup');
  const isSkill = SKILLS.includes(name);
  // panels
  document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = p.id !== 'tab-' + name; });
  // practice subtabs
  const subtabs = document.querySelector('#practiceSubtabs');
  if (subtabs) {
    subtabs.hidden = !isSkill;
    if (isSkill) {
      document.querySelectorAll('#practiceSubtabs button').forEach((b) => {
        const on = b.dataset.skill === name;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
    }
  }
  highlightNav(name);
  LV.updateTeacherContext();

  if (name === 'today') { renderPlan(); renderCoach(); }
  if (name === 'path') renderPath();
  if (name === 'setup') { loadProfileUI(); renderPlaceResults(); }
  if (name === 'vocab') renderVocabAll();
  if (name === 'reading') renderReadLibrary();
  if (name === 'writing') startWriting(writingState.mode);
  if (name === 'toeic') { try { window.LVToeic?.showHome(); } catch {} }
  if (name === 'listening' && (!window.LV.quiz || !window.LV.quiz.sentence)) {
    // Prompt 4: mở trực tiếp tab Nghe -> tự khởi tạo câu đầu tiên, không 0/0
    try { window.startQuiz(); } catch {}
  }
}
window.switchTab = switchTab;

// Điều hướng bằng bàn phím trên tablist (Prompt 2/5): ArrowLeft/Right, Home/End
function wireTablistKeyboard(tablistEl) {
  tablistEl.addEventListener('keydown', (e) => {
    const items = [...tablistEl.querySelectorAll('[role="tab"]')].filter((el) => !el.disabled);
    const idx = items.indexOf(document.activeElement);
    if (idx < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = items[(idx + 1) % items.length];
    else if (e.key === 'ArrowLeft') next = items[(idx - 1 + items.length) % items.length];
    else if (e.key === 'Home') next = items[0];
    else if (e.key === 'End') next = items[items.length - 1];
    if (next) { e.preventDefault(); next.focus(); next.click(); }
  });
}

function shuffleArr(a) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }
// $ được định nghĩa sẵn ở app.js (global lexical) — dùng chung

function learningInit() {
  applyLearnerMode(store.profile.ageGroup);
  // Tabs: top nav + bottom nav + practice subtabs
  document.querySelectorAll('.main-tab, #bottomNav button, #journeyProfile').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  document.querySelectorAll('#practiceSubtabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.skill)));
  const mainTabs = document.getElementById('mainTabs');
  if (mainTabs) wireTablistKeyboard(mainTabs);
  const pSub = document.getElementById('practiceSubtabs');
  if (pSub) wireTablistKeyboard(pSub);
  const roadmapGo = document.getElementById('roadmapGo');
  if (roadmapGo) roadmapGo.addEventListener('click', () => switchTab('path'));
  const ogGo = document.getElementById('ogGo');
  if (ogGo) ogGo.addEventListener('click', () => startActivity('setup', 'setup'));
  const ogSkip = document.getElementById('ogSkip');
  if (ogSkip) ogSkip.addEventListener('click', () => { const g = document.getElementById('onboardGuide'); if (g) g.hidden = true; });

  // Onboarding 3 bước
  document.querySelectorAll('#wgMin button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#wgMin button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
  }));
  document.querySelectorAll('#onboardAgePicker input').forEach((input) => input.addEventListener('change', () => applyLearnerMode(input.value)));
  const onboardName = document.getElementById('onboardName');
  if (onboardName) onboardName.addEventListener('input', () => {
    const p = store.profile;
    p.displayName = cleanDisplayName(onboardName.value);
    store.profile = p;
    renderJourneyIdentity();
  });
  $('#wgNext1').addEventListener('click', () => { wgSaveProfile(); wgRenderPlaceResult(); wgShowStep(2); });
  $('#wgPlaceEn').addEventListener('click', () => startPlacement('en'));
  $('#wgPlaceZh').addEventListener('click', () => startPlacement('zh'));
  $('#wgSkipPlace').addEventListener('click', () => { wgSaveProfile(); wgShowSummary(); wgShowStep(3); });
  $('#wgNext2').addEventListener('click', () => { wgSaveProfile(); wgShowSummary(); wgShowStep(3); });
  $('#wgStart').addEventListener('click', wgFinish);

  // Setup
  document.querySelectorAll('#minutesSeg button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#minutesSeg button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
  }));
  document.querySelectorAll('#profileAgePicker input').forEach((input) => input.addEventListener('change', () => applyLearnerMode(input.value)));
  const profileName = document.getElementById('profileName');
  if (profileName) profileName.addEventListener('input', () => {
    const p = store.profile;
    p.displayName = cleanDisplayName(profileName.value);
    store.profile = p;
    renderJourneyIdentity();
  });
  $('#splitEn').addEventListener('input', () => {
    const v = Number($('#splitEn').value);
    $('#splitLabel').textContent = `English ${v}% · 中文 ${100 - v}%`;
  });
  $('#profileSave').addEventListener('click', saveProfile);
  $('#teacherCustomSave').addEventListener('click', saveTeacherCustomization);
  $('#teacherVoicePreview').addEventListener('click', previewTeacherVoice);
  $('#teacherSpeed').addEventListener('input', () => { $('#teacherSpeedValue').textContent = `${Number($('#teacherSpeed').value).toFixed(2)}×`; });
  $('#teacherCustomizeOpen').addEventListener('click', () => {
    switchTab('setup');
    setTimeout(() => {
      const card = document.getElementById('teacherCustomCard');
      if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); card.focus({ preventScroll: true }); }
    }, 50);
  });
  applyTeacherProfileUI(LV.getTeacherProfile());
  $('#placeEn').addEventListener('click', () => startPlacement('en'));
  $('#placeZh').addEventListener('click', () => startPlacement('zh'));
  $('#placeClose').addEventListener('click', () => closeModal($('#placementModal')));
  $('#placementModal').addEventListener('click', (e) => { if (e.target === $('#placementModal')) closeModal($('#placementModal')); });
  $('#placeNext').addEventListener('click', placeNext);

  // Trí nhớ dài hạn
  $('#memorySync').addEventListener('click', () => { syncMemory(); renderMemory(); LV.toast('Đã đồng bộ bộ nhớ cô giáo.'); });
  async function saveMemoryNote() {
    const note = $('#memoryNoteInput').value.trim();
    if (!note) return LV.toast('Nhập ghi chú trước.');
    $('#memoryNoteInput').value = '';
    try {
      await fetch('/api/memory/note', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
      renderMemory();
      LV.toast('Cô giáo đã ghi nhớ ghi chú này.');
    } catch { LV.toast('Không lưu được ghi chú.'); }
  }
  $('#memoryNoteBtn').addEventListener('click', saveMemoryNote);
  $('#memoryNoteInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveMemoryNote(); });

  // Vocabulary Studio
  $('#vsReviewStart').addEventListener('click', vsStartReview);
  $('#vsReviewQuick').addEventListener('click', vsStartReview);
  $('#vsLearnStart').addEventListener('click', vsStartLearn);
  $('#vsLearnQuick').addEventListener('click', vsStartLearn);
  $('#vsExit').addEventListener('click', vsExit);
  $('#vsReveal').addEventListener('click', vsReveal);
  $('#vsUnderstood').addEventListener('click', vsUnderstood);
  $('#vsBriefExit').addEventListener('click', vsCloseBrief);
  $('#vsBriefStart').addEventListener('click', vsBriefBegin);
  document.querySelectorAll('#vsBriefBatch button').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    vs.batchSize = Number(b.dataset.batch);
    saveLearnBatch(vs.batchSize);
    renderVsBrief(vsNewWords());
  }));
  // Chip gói trong briefing: đổi gói -> danh sách từ preview đổi theo
  $('#vsBriefTopic').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-topic]');
    if (!b || b.disabled) return;
    vs.topic = b.dataset.topic;
    saveLearnTopic(vs.topic);
    const words = vsNewWords();
    vs.batchSize = Math.min(loadLearnBatch(), Math.max(1, words.length));
    renderVsBrief(words);
  });
  $('#vsSumNext').addEventListener('click', vsOpenBrief);
  $('#vsSumTest').addEventListener('click', () => switchTab('toeic'));
  $('#vsSumHome').addEventListener('click', () => { hideStudioPanes('home'); renderStudioHome(); });
  // "Nghe" đọc TỪ (kể cả chậm) — nhu cầu nghe phát âm đúng từ mới; câu mẫu nghe qua khu luyện nói
  $('#vsPlay').addEventListener('click', () => { const cur = vsCurrentItem(); if (cur) LV.playText(cur.item.term, LV.language, { announceFallback: false }); });
  $('#vsPlaySlow').addEventListener('click', () => { const cur = vsCurrentItem(); if (cur) LV.playText(cur.item.term, LV.language, { speed: 0.75, announceFallback: false }); });
  $('#vsPronMic').addEventListener('click', vsPronRecord);
  $('#vsPronPlay').addEventListener('click', () => { const t = vsPronTargetText(); if (t) LV.playText(t, LV.language, { announceFallback: false }); });
  document.querySelectorAll('#vsPronTargets button').forEach((b) => b.addEventListener('click', () => vsPronSetTarget(b.dataset.target)));
  document.querySelectorAll('#vsGrades .grade').forEach((b) => b.addEventListener('click', () => vsGrade(Number(b.dataset.grade))));
  document.querySelectorAll('#studioTabs button').forEach((b) => b.addEventListener('click', () => vsShowView(b.dataset.vview)));

  // Keyboard: Space = hiện đáp án / đã hiểu, 1–4 = đánh giá, Esc = thoát
  document.addEventListener('keydown', (e) => {
    const studioPane = ['vstudio-brief', 'vstudio-session', 'vstudio-summary'].find((id) => !document.getElementById(id).hidden);
    if (!studioPane) return;
    if (e.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) return; // nút đang focus tự xử phím (vd mic) — không bắn Space/1-4 trùng
    if (e.key === 'Escape') {
      if (studioPane === 'vstudio-brief') vsCloseBrief();
      else if (studioPane === 'vstudio-summary') { hideStudioPanes('home'); renderStudioHome(); }
      else vsExit();
      return;
    }
    if (studioPane !== 'vstudio-session') return;
    if (e.code === 'Space') { e.preventDefault(); vsReveal(); }
    else if (e.key === '1') vsGrade(1);
    else if (e.key === '2') vsGrade(2);
    else if (e.key === '3') vsGrade(3);
    else if (e.key === '4') vsGrade(5);
  });

  // Word Bank
  $('#vsSearch').addEventListener('input', renderVsBank);
  $('#vsLangFilter').addEventListener('change', () => { vsFillTopicFilter(); renderVsBank(); });
  $('#vsTopicFilter').addEventListener('change', renderVsBank);
  $('#vsCefrFilter').addEventListener('change', renderVsBank);
  $('#vsStateFilter').addEventListener('change', renderVsBank);
  $('#vsFreqFilter').addEventListener('change', renderVsBank);
  $('#vsWorkFilter').addEventListener('change', renderVsBank);
  $('#vsAddBtn').addEventListener('click', vsAddWord);
  $('#vsAddInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') vsAddWord(); });
  $('#vsDetailClose').addEventListener('click', () => closeModal($('#vsDetail')));
  // Nhấn giữ từ / câu mẫu trên thẻ để xem chi tiết: nghĩa, cách dùng, nghe, đọc thử
  vsBindLongPress($('#vsTerm'), () => vs.currentItem);
  vsBindLongPress($('#vsExample'), () => vs.currentItem);
  $('#vsDetail').addEventListener('click', (e) => { if (e.target === $('#vsDetail')) closeModal($('#vsDetail')); });
  document.querySelectorAll('.modal').forEach((modal) => modal.addEventListener('keydown', handleModalKeydown));
  $('#mistakeClear').addEventListener('click', () => {
    store.mistakes = store.mistakes.filter((m) => m.lang !== LV.language || m.status !== 'done');
    renderMistakes();
  });

  // Writing
  document.querySelectorAll('#writingModes button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#writingModes button').forEach((x) => {
      const selected = x === b;
      x.classList.toggle('active', selected); x.setAttribute('aria-selected', String(selected)); x.tabIndex = selected ? 0 : -1;
    });
    startWriting(b.dataset.mode);
  }));
  $('#writingSkip').addEventListener('click', () => completeWritingItem(false));
  wireTablistKeyboard($('#writingModes'));

  // Speaking
  document.querySelectorAll('#speakingModes button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#speakingModes button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const mode = b.dataset.mode;
    document.body.classList.toggle('teacher-conversation', mode === 'qa');
    $('#speak-shadowing').hidden = mode !== 'shadowing';
    $('#speak-pron').hidden = mode !== 'pron';
    $('#speak-roleplay').hidden = mode !== 'roleplay';
    $('#speak-qa').hidden = mode !== 'qa';
    if (mode === 'pron' && !pronState.item) pronPick();
  }));
  $('#shadowPlay').addEventListener('click', () => { const s = shadowState.queue[shadowState.index]; if (s) LV.playText(s.text, LV.language, { announceFallback: false }); });
  $('#shadowRecord').addEventListener('click', shadowRecord);
  $('#shadowNext').addEventListener('click', () => shadowNext());
  $('#pronPlay').addEventListener('click', () => { if (pronState.item) LV.playText(pronState.item.text, LV.language, { announceFallback: false }); });
  $('#pronMic').addEventListener('click', pronRecord);
  $('#pronNext').addEventListener('click', pronPick);
  $('#pronSource').addEventListener('change', pronPick);
  $('#scenarioSelect').replaceChildren();
  ROLEPLAY_SCENARIOS.forEach((s) => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.vi; $('#scenarioSelect').append(o); });
  $('#rpSend').addEventListener('click', rpSend);
  $('#rpEnd').addEventListener('click', rpEnd);
  $('#rpMic').addEventListener('click', rpMic);
  $('#rpInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') rpSend(); });
  $('#scenarioSelect').addEventListener('change', () => { if (rpState.running) rpStart(); });
  // nút bắt đầu roleplay: dùng chính select khi thay đổi? Thêm nút bắt đầu rõ ràng qua sự kiện change + click đầu tiên
  $('#scenarioSelect').addEventListener('click', () => { if (!rpState.running && !rpState._armed) { rpState._armed = true; } });
  $('#scenarioSelect').addEventListener('change', () => { if (rpState._armed) rpStart(); });
  $('#qaSend').addEventListener('click', () => qaSend());
  $('#qaInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') qaSend(); });
  $('#qaMic').addEventListener('click', qaMic);
  function updateQaVoiceUI() {
    $('#qaVoice').setAttribute('aria-pressed', String(vcState.auto));
    $('#qaVoiceLabel').textContent = vcState.auto ? '● Đang nghe bạn… (bấm để tắt)' : 'Bật giọng nói';
    $('#qaVoice').setAttribute('aria-label', vcState.auto ? 'Tắt chế độ hội thoại giọng nói' : 'Bật chế độ hội thoại giọng nói');
  }
  $('#qaVoice').addEventListener('click', () => {
    vcState.auto = !vcState.auto;
    updateQaVoiceUI();
    if (!vcState.auto) {
      if (vcState.rec) { try { vcState.rec.cancel(); } catch {} }
      LV.setCoLinhState('idle', 'Đã tắt giọng nói. Bạn vẫn có thể gõ.');
      return;
    }
    // bật -> nghe NGAY để bạn nói luôn
    LV.setCoLinhState('listening', 'Cô đang nghe bạn nói…');
    vcListen().then((heard) => {
      if (!vcState.auto) return;
      if (heard) qaSend(heard);
      else LV.setCoLinhState('idle', 'Không nghe rõ — nói lại hoặc gõ tin nhắn.');
    });
  });
  document.querySelectorAll('#qaPrompts .chip').forEach((c) => c.addEventListener('click', () => qaSend(c.dataset.q)));

  // Reading
  document.querySelectorAll('#readLevels button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#readLevels button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    readState.level = Number(b.dataset.level);
    renderReadLibrary();
  }));
  $('#readBack').addEventListener('click', () => { $('#readView').hidden = true; $('#readLibrary').hidden = false; });
  $('#readAloud').addEventListener('click', readAloud);

  // Lang change: cập nhật mọi module
  const origSetLang = LV.setLanguage.bind(window);
  LV.setLanguage = function (lang) {
    origSetLang(lang);
    renderPlan();
    loadProfileUI();
    if (!document.getElementById('tab-vocab').hidden) renderVocabAll();
    if (!document.getElementById('tab-reading').hidden) renderReadLibrary();
    if (!document.getElementById('tab-writing').hidden) startWriting(writingState.mode);
    shadowState.queue = [];
    shadowNext();
    pronState.item = null; // câu/từ cũ thuộc ngôn ngữ trước — chọn lại theo ngôn ngữ mới
    if (!document.getElementById('speak-pron').hidden) pronPick();
  };
  document.getElementById('langEn').addEventListener('click', () => LV.setLanguage('en'));
  document.getElementById('langZh').addEventListener('click', () => LV.setLanguage('zh'));

  shadowNext();
  renderPlan();
  loadProfileUI();
  renderVocabAll();
  syncMemory();
  renderMemory();
  initVocabData(); // nạp dữ liệu đã chuẩn bị (async, re-render khi xong)
  switchTab('today');
  maybeStartOnboarding(); // lần đầu mở app -> wizard 3 bước
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', learningInit);
else learningInit();
