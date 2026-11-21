import {
  DailyLesson,
  DailyLessonContent,
  LessonVocabItem,
  LessonGrammar,
  LessonExpression,
  LessonListening,
  LessonSpeaking,
  PracticeQuizItem,
  LessonWarmup,
} from '@/types/database';
import { initialDecks, sampleLearningItems, sampleCollectionItems } from '@/data/mockData';
import dailyItemsJson from '@/data/dailyItems.json';

// Import các bài học mẫu để dùng làm ngân hàng từ vựng và kịch bản
import restaurant01 from '@/data/lessons/restaurant-lesson-01.json';
import restaurant02 from '@/data/lessons/restaurant-lesson-02.json';
import travel01 from '@/data/lessons/travel-lesson-01.json';
import travel02 from '@/data/lessons/travel-lesson-02.json';
import workplace01 from '@/data/lessons/workplace-lesson-01.json';
import shopping01 from '@/data/lessons/shopping-lesson-01.json';
import daily01 from '@/data/lessons/daily-lesson-01.json';

export interface DailyLessonGeneratorOptions {
  dateStr?: string;
  deckId?: string; // Tương thích ngược
  collectionId?: string; // ID Collection của Thematic Sprint
  sprintDay?: 1 | 2 | 3; // Ngày trong chu kỳ 3 ngày (1: Khởi động, 2: Tương tác, 3: Phản xạ)
  userMasteredIds?: string[];
  userLearningIds?: string[];
  mode?: 'hybrid' | 'ai';
  forceRegenerate?: boolean;
  language?: 'vi' | 'en'; // Ngôn ngữ hiển thị bài học (tiếng Việt hoặc tiếng Anh)
}

export interface SprintStageDefinition {
  stage_day: 1 | 2 | 3;
  stage_title: string;
  stage_subtitle: string;
  stage_title_en?: string;
  stage_subtitle_en?: string;
  warmup: {
    situation: string;
    situation_en?: string;
    objective: string;
    objective_en?: string;
    warm_up_question: string;
    key_phrases: string[];
    image_url?: string;
  };
  grammar: LessonGrammar;
  grammar_en?: LessonGrammar;
  expressions: LessonExpression[];
  listening: LessonListening[];
  speaking: LessonSpeaking;
}

interface ThematicSprintTemplate {
  collection_id: string;
  title: string;
  title_en?: string;
  topic: string;
  topic_en?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  estimated_minutes: number;
  image_url: string;
  stages: Record<1 | 2 | 3, SprintStageDefinition>;
  grammar_quizzes: {
    question: string;
    options: string[];
    correct_answer: number;
    explanation?: string;
    explanation_en?: string;
  }[];
}

/**
 * Lấy ngôn ngữ hiệu lực (ưu tiên options.language, kế đến localStorage, mặc định 'vi')
 */
export function getEffectiveLanguage(lang?: 'vi' | 'en'): 'vi' | 'en' {
  if (lang === 'vi' || lang === 'en') return lang;
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('speakup-language');
      if (stored === 'vi' || stored === 'en') return stored;
    }
  } catch (_) {}
  return 'vi';
}

// Ngân hàng Ngữ pháp bản tiếng Anh (English Grammar Versions)
const restaurantGrammar01_en: LessonGrammar = {
  title: "Polite Requests with 'Could' and 'Would like'",
  explanation: "In polite dining contexts, native speakers rarely use blunt requests like 'I want...' or direct imperatives like 'Give me...'. Instead, they consistently use courteous structures such as 'Could we have...?' or 'I would like...'. Always conclude with 'please'.",
  formula: "Could + I / we + have + [Noun], please? | I would like + to order / [Noun]",
  examples: (restaurant01 as unknown as DailyLessonContent).grammar.examples,
  common_mistakes: [
    {
      wrong: "Give me the menu. / I want beef.",
      correct: "Could I see the menu, please? / I would like the beef.",
      explanation: "'Give me' or 'I want' sounds abrupt and demanding to service staff. Always use 'Could I...' or 'I would like...' and conclude with 'please'.",
    },
    {
      wrong: "Can we have the bill? (Is 'Can' acceptable?)",
      correct: "Could we have the check / bill, please?",
      explanation: "'Can' is understood, but 'Could' is significantly more polite and appropriate in dining contexts.",
    },
  ],
};

const restaurantGrammar02_en: LessonGrammar = {
  title: "Asking for Recommendations & Inquiring Ingredients",
  explanation: "When ordering at a restaurant, use 'What do you recommend?' to ask for specials and 'Does this contain...?' or 'Is it served with...?' to check ingredients or allergens politely.",
  formula: "What do you recommend for [course]? | Does this dish contain [ingredient]?",
  examples: (restaurant02 as unknown as DailyLessonContent).grammar?.examples || (restaurant01 as unknown as DailyLessonContent).grammar.examples,
  common_mistakes: [
    {
      wrong: "What food good here?",
      correct: "What would you recommend? / What is today's special?",
      explanation: "Use proper modal questions instead of incomplete literal translations.",
    },
  ],
};

const travelGrammar01_en: LessonGrammar = {
  title: "Indirect Questions & Polite Airport Requests",
  explanation: "At the airport, to inquire politely with airline staff, native speakers use indirect questions beginning with 'Could you tell me...' or 'Do you know if...'. Note: in indirect questions, word order returns to affirmative form (Subject + Verb).",
  formula: "Could you tell me where / what time / which + [subject] + [verb]? | Could I please have a [seat type]?",
  examples: (travel01 as unknown as DailyLessonContent).grammar.examples,
  common_mistakes: [
    {
      wrong: "Could you tell me where is the gate?",
      correct: "Could you tell me where the gate is?",
      explanation: "In indirect questions, question inversion is not applied after the question word. The subject comes before the verb.",
    },
    {
      wrong: "Give me window seat.",
      correct: "Could I have a window seat, please?",
      explanation: "Always use 'Could I have...' with 'please' to speak politely at the check-in desk.",
    },
  ],
};

const travelGrammar02_en: LessonGrammar = {
  title: "Immigration & Hotel Dialogues: State of Being & Duration",
  explanation: "When passing through immigration or checking in at a hotel, use 'I am staying for [duration]' and 'I am here for [purpose: tourism/business]'.",
  formula: "I am here for + [vacation / business] | I will be staying for + [number] days",
  examples: (travel02 as unknown as DailyLessonContent).grammar?.examples || (travel01 as unknown as DailyLessonContent).grammar.examples,
  common_mistakes: [
    {
      wrong: "I stay 5 day.",
      correct: "I will be staying for five days.",
      explanation: "Use correct preposition 'for' and future continuous or future simple for travel duration.",
    },
  ],
};

const workplaceGrammar01_en: LessonGrammar = {
  title: "Tenses for Standup Updates: Past Simple vs. Present Continuous vs. Future Intentions",
  explanation: "In daily standups, deliver concise updates using three tenses: 1) Past Simple for yesterday's completed work, 2) Present Continuous for tasks in progress, and 3) 'Plan to / will focus on' for today's priority.",
  formula: "Yesterday: I [completed / wrapped up] + [task] | Today: I plan to / will focus on + [task] | Blockers: I am blocked by + [noun/V-ing]",
  examples: (workplace01 as unknown as DailyLessonContent).grammar.examples,
  common_mistakes: [
    {
      wrong: "Yesterday I do task...",
      correct: "Yesterday I worked on / finished the task.",
      explanation: "Use Past Simple tense when reporting work completed yesterday.",
    },
    {
      wrong: "I have no block.",
      correct: "I have no blockers on my end.",
      explanation: "In Agile methodology, the proper term for impediments is 'blocker'.",
    },
  ],
};

const shoppingGrammar01_en: LessonGrammar = {
  title: "Comparatives for Sizing (A bit too + Adj / One size up or down)",
  explanation: "When trying on clothes, express fit with 'a bit too tight' or 'a bit too loose', and request adjustments with 'one size up' (larger) or 'one size down' (smaller).",
  formula: "It is a bit too [tight / loose / small / large] | Do you have this in [a smaller size / one size up]?",
  examples: (shopping01 as unknown as DailyLessonContent).grammar.examples,
  common_mistakes: [
    {
      wrong: "Have bigger size?",
      correct: "Do you have this in a larger size? / Do you have one size up?",
      explanation: "Use complete, polite phrasing like 'Do you have this in a larger size?'.",
    },
    {
      wrong: "Where is room to wear clothes?",
      correct: "Where are the fitting rooms?",
      explanation: "The standard English term is 'fitting room' or 'changing room'.",
    },
  ],
};

const dailyGrammar01_en: LessonGrammar = {
  title: "Present Perfect for Recent Life Updates",
  explanation: "When catching up with someone after time apart, native speakers use the Present Perfect tense to ask about recent experiences and updates.",
  formula: "What have you been up to lately? | I have recently [moved / started a new job] | I haven't seen you since [time]",
  examples: (daily01 as unknown as DailyLessonContent).grammar.examples,
  common_mistakes: [
    {
      wrong: "What you do now?",
      correct: "What have you been up to lately? / How have you been?",
      explanation: "Use 'What have you been up to lately?' to naturally ask about recent life developments.",
    },
    {
      wrong: "Long time no see you.",
      correct: "Long time no see! / It's been so long!",
      explanation: "The standard idiom is 'Long time no see!' without 'you'.",
    },
  ],
};

// Danh sách các chuyên đề (Thematic Sprints) 3 ngày xoay vòng theo thứ tự
export const THEMATIC_SPRINT_ORDER = [
  'col-restaurant',
  'col-travel',
  'col-workplace',
  'col-shopping',
  'col-daily-conversations',
];

// Ngân hàng kịch bản 3 giai đoạn chuẩn chỉnh (Thematic Sprint Engine) đa ngôn ngữ
export const SPRINT_TEMPLATES: Record<string, ThematicSprintTemplate> = {
  'col-restaurant': {
    collection_id: 'col-restaurant',
    title: 'Dining & Restaurant Communication',
    title_en: 'Dining & Restaurant Communication',
    topic: 'Dining & Food Reflexes',
    topic_en: 'Dining & Food Reflexes',
    level: 'A2',
    estimated_minutes: 30,
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    stages: {
      1: {
        stage_day: 1,
        stage_title: 'Giai đoạn 1: Khởi động & Nền tảng (Đặt bàn & Đến quán)',
        stage_title_en: 'Stage 1: Warm-up & Foundation (Table Reservation & Arrival)',
        stage_subtitle: 'Làm quen tình huống, đặt bàn lịch sự và chọn vị trí ngồi lý tưởng.',
        stage_subtitle_en: 'Familiarize yourself with the scenario, make a polite reservation, and choose an ideal seat.',
        warmup: {
          situation: 'Bạn đến một nhà hàng quốc tế hoặc gọi điện đặt bàn cho tối nay. Bạn cần trao đổi với lễ tân để chọn bàn 2 người gần cửa sổ.',
          situation_en: 'You arrive at an international restaurant or call to make a reservation for tonight. You need to speak with the host to request a table for two by the window.',
          objective: 'Nắm vững các mẫu câu đặt chỗ lịch sự: "Could we have a table for two?" và các từ vựng khởi động.',
          objective_en: 'Master polite reservation phrases: "Could we have a table for two?" and essential warm-up vocabulary.',
          warm_up_question: 'When dining out abroad, what is the most polite phrase you use to ask for a table or check the menu?',
          key_phrases: ['Could we have a table for two?', 'Do you have a reservation?', 'By the window, please.'],
          image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (restaurant01 as unknown as DailyLessonContent).grammar,
        grammar_en: restaurantGrammar01_en,
        expressions: (restaurant01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (restaurant01 as unknown as DailyLessonContent).listening,
        speaking: (restaurant01 as unknown as DailyLessonContent).speaking,
      },
      2: {
        stage_day: 2,
        stage_title: 'Giai đoạn 2: Đào sâu & Tương tác (Xem Menu & Gọi món)',
        stage_title_en: 'Stage 2: Deep Dive & Interaction (Menu & Ordering)',
        stage_subtitle: 'Hỏi gợi ý món ăn đặc sắc của quán, hỏi dị ứng nguyên liệu và gọi món.',
        stage_subtitle_en: 'Ask for chef recommendations, inquire about dietary restrictions, and order dishes.',
        warmup: {
          situation: 'Người phục vụ mang thực đơn ra. Bạn muốn hỏi món ngon nhất (chef specials), hỏi thành phần món ăn vì ăn kiêng và gọi đồ uống.',
          situation_en: "The waiter brings the menu. You want to ask for the chef's specials, check ingredients for dietary needs, and order drinks.",
          objective: 'Tự tin hỏi: "What do you recommend?" và "Does this dish contain...?"',
          objective_en: 'Confidently ask: "What do you recommend?" and "Does this dish contain...?"',
          warm_up_question: 'How do you ask the waiter to recommend the best dish on the menu?',
          key_phrases: ['What do you recommend?', 'Is this dish spicy?', 'I would like the steak, please.'],
          image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (restaurant02 as unknown as DailyLessonContent).grammar,
        grammar_en: restaurantGrammar02_en,
        expressions: (restaurant02 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (restaurant02 as unknown as DailyLessonContent).listening,
        speaking: (restaurant02 as unknown as DailyLessonContent).speaking,
      },
      3: {
        stage_day: 3,
        stage_title: 'Giai đoạn 3: Xử lý tình huống & Thử thách phản xạ (Phàn nàn & Thanh toán)',
        stage_title_en: 'Stage 3: Handling Situations & Reflex Challenge (Complaints & Payment)',
        stage_subtitle: 'Xử lý khi món ăn bị nhầm/nguội, khen ngợi đầu bếp và thanh toán chia đôi bill.',
        stage_subtitle_en: 'Handle cold or incorrect dishes, compliment the chef, and split the bill.',
        warmup: {
          situation: 'Món ăn mang ra bị nguội hoặc bạn cần xin thêm gia vị. Sau khi ăn xong, bạn muốn thanh toán chia đôi bill bằng 2 thẻ ngân hàng.',
          situation_en: 'Your food arrives cold or you need extra condiments. After finishing, you want to split the check across two cards.',
          objective: 'Làm chủ phản xạ xử lý tình huống phát sinh: "Excuse me, but this seems underdone" và "Can we split the bill?"',
          objective_en: 'Master reflexes for unexpected situations: "Excuse me, but this seems underdone" and "Can we split the bill?"',
          warm_up_question: 'How do you politely complain if food is cold, or ask to split the bill between two people?',
          key_phrases: ['Could we get the check, please?', 'Can we split the bill?', 'Everything was delicious!'],
          image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (restaurant01 as unknown as DailyLessonContent).grammar,
        grammar_en: restaurantGrammar01_en,
        expressions: (restaurant02 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (restaurant02 as unknown as DailyLessonContent).listening,
        speaking: (restaurant02 as unknown as DailyLessonContent).speaking,
      },
    },
    grammar_quizzes: [
      {
        question: "Choose the most polite way to ask for the menu in a restaurant:",
        options: ["Give me the menu right now.", "Could we have the menu, please?", "I want the menu.", "Bring menu here."],
        correct_answer: 1,
        explanation: "Cấu trúc 'Could we have + [noun], please?' là cách diễn đạt lịch sự và chuẩn xác nhất.",
        explanation_en: "The pattern 'Could we have + [noun], please?' is the most polite and natural expression.",
      },
      {
        question: "Complete the sentence: 'I ______ like to order the grilled salmon, please.'",
        options: ["could", "would", "must", "shall"],
        correct_answer: 1,
        explanation: "Cụm 'would like to + verb' dùng để diễn tả mong muốn một cách nhã nhặn.",
        explanation_en: "The phrase 'would like to + verb' expresses polite requests or desires.",
      },
    ],
  },

  'col-travel': {
    collection_id: 'col-travel',
    title: 'Airport, Hotel & Travel Communication',
    title_en: 'Airport, Hotel & Travel Communication',
    topic: 'Travel & Accommodation',
    topic_en: 'Travel & Accommodation',
    level: 'A2',
    estimated_minutes: 35,
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    stages: {
      1: {
        stage_day: 1,
        stage_title: 'Giai đoạn 1: Khởi động & Nền tảng (Sân bay & Check-in vé)',
        stage_title_en: 'Stage 1: Warm-up & Foundation (Airport & Flight Check-in)',
        stage_subtitle: 'Làm thủ tục check-in tại quầy sân bay, gửi hành lý và chọn ghế ngồi.',
        stage_subtitle_en: 'Check in at the airport counter, drop off luggage, and choose your preferred seat.',
        warmup: {
          situation: 'Bạn đang bắt đầu chuyến du lịch quốc tế. Bạn cần làm thủ tục check-in tại quầy sân bay, gửi hành lý, chọn ghế ngồi gần cửa sổ.',
          situation_en: 'You are starting an international trip. You need to check in at the airport counter, drop off luggage, and request a window seat.',
          objective: 'Tự tin giao tiếp tại sân bay: "Could I have a window seat, please?" và các từ vựng thủ tục bay.',
          objective_en: 'Confidently communicate at the airport: "Could I have a window seat, please?" and master boarding vocabulary.',
          warm_up_question: 'Do you prefer a window seat or an aisle seat when flying, and what time do you usually check in?',
          key_phrases: ['Could I have a window seat, please?', 'Here is my passport and booking.', 'Which gate is flight VN123?'],
          image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (travel01 as unknown as DailyLessonContent).grammar,
        grammar_en: travelGrammar01_en,
        expressions: (travel01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (travel01 as unknown as DailyLessonContent).listening,
        speaking: (travel01 as unknown as DailyLessonContent).speaking,
      },
      2: {
        stage_day: 2,
        stage_title: 'Giai đoạn 2: Đào sâu & Tương tác (Hải quan & Lấy hành lý)',
        stage_title_en: 'Stage 2: Deep Dive & Interaction (Immigration & Baggage Claim)',
        stage_subtitle: 'Qua cổng kiểm tra an ninh, trả lời câu hỏi hải quan và tìm băng chuyền hành lý.',
        stage_subtitle_en: 'Go through security, answer immigration questions, and find the baggage carousel.',
        warmup: {
          situation: 'Máy bay vừa hạ cánh tại sân bay quốc tế. Bạn cần xếp hàng nhập cảnh, trả lời mục đích chuyến đi và ra băng chuyền nhận hành lý.',
          situation_en: 'Your flight just landed at an international airport. You queue for immigration, state your travel purpose, and head to baggage claim.',
          objective: 'Làm chủ các mẫu câu giao tiếp với nhân viên hải quan và hỏi đường nhận hành lý (baggage claim).',
          objective_en: 'Master communication with immigration officers and ask directions to baggage claim.',
          warm_up_question: 'What is the purpose of your trip when an immigration officer asks?',
          key_phrases: ['I am here for tourism / vacation.', 'Where is the baggage claim area?', 'How long will you be staying?'],
          image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (travel02 as unknown as DailyLessonContent).grammar,
        grammar_en: travelGrammar02_en,
        expressions: (travel02 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (travel02 as unknown as DailyLessonContent).listening,
        speaking: (travel02 as unknown as DailyLessonContent).speaking,
      },
      3: {
        stage_day: 3,
        stage_title: 'Giai đoạn 3: Xử lý tình huống & Thử thách phản xạ (Khách sạn & Sự cố)',
        stage_title_en: 'Stage 3: Handling Situations & Reflex Challenge (Hotel & Unexpected Issues)',
        stage_subtitle: 'Nhận phòng khách sạn, yêu cầu tiện ích và xử lý tình huống hành lý thất lạc.',
        stage_subtitle_en: 'Check into your hotel, request amenities, and handle room key or luggage issues.',
        warmup: {
          situation: 'Bạn đến khách sạn để nhận phòng, hỏi giờ phục vụ bữa sáng và xử lý tình huống cần đổi thẻ phòng từ bị hỏng.',
          situation_en: 'You arrive at the hotel to check in, ask about breakfast hours, and resolve an issue with a malfunctioning key card.',
          objective: 'Tự tin check-in và xử lý mọi yêu cầu trong suốt thời gian lưu trú tại khách sạn.',
          objective_en: 'Confidently check in and manage requests throughout your hotel stay.',
          warm_up_question: 'What do you say to the hotel receptionist when you arrive to check in?',
          key_phrases: ['I have a reservation under the name...', 'What time is breakfast served?', 'The key card is not working.'],
          image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (travel01 as unknown as DailyLessonContent).grammar,
        grammar_en: travelGrammar01_en,
        expressions: (travel02 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (travel02 as unknown as DailyLessonContent).listening,
        speaking: (travel02 as unknown as DailyLessonContent).speaking,
      },
    },
    grammar_quizzes: [
      {
        question: "Which indirect question is grammatically correct for an airport inquiry?",
        options: [
          "Could you tell me where is the departure gate?",
          "Could you tell me where the departure gate is?",
          "Tell me where is gate right now.",
          "Where the gate is you know?"
        ],
        correct_answer: 1,
        explanation: "Trong câu hỏi gián tiếp, thứ tự từ là: từ để hỏi (where) + chủ ngữ (the departure gate) + động từ (is).",
        explanation_en: "In indirect questions, the word order is: question word (where) + subject (the departure gate) + verb (is).",
      },
      {
        question: "Complete the hotel inquiry: 'Is high-speed WiFi ______ in the room rate?'",
        options: ["included", "including", "includes", "include"],
        correct_answer: 0,
        explanation: "Cấu trúc bị động chuẩn: 'Is [noun] included in...?'",
        explanation_en: "Standard passive question structure: 'Is [noun] included in...?'",
      },
    ],
  },

  'col-workplace': {
    collection_id: 'col-workplace',
    title: 'Workplace & Standup Meetings',
    title_en: 'Workplace & Standup Meetings',
    topic: 'Professional Agile Communication',
    topic_en: 'Professional Agile Communication',
    level: 'B1',
    estimated_minutes: 40,
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    stages: {
      1: {
        stage_day: 1,
        stage_title: 'Giai đoạn 1: Khởi động & Nền tảng (Báo cáo tiến độ Standup)',
        stage_title_en: 'Stage 1: Warm-up & Foundation (Standup Progress Reporting)',
        stage_subtitle: 'Cập nhật ngắn gọn việc đã làm hôm qua và mục tiêu trọng tâm hôm nay.',
        stage_subtitle_en: 'Briefly report what you finished yesterday and your main focus for today.',
        warmup: {
          situation: 'Bạn đang tham gia buổi họp Daily Standup đầu ngày cùng nhóm dự án đa quốc gia. Bạn cần báo cáo tiến độ công việc.',
          situation_en: 'You are joining a morning Daily Standup with a multinational project team. You need to provide a concise status update.',
          objective: 'Làm chủ các mẫu câu báo cáo tiến độ chuẩn xác: "Yesterday, I wrapped up..." và "Today, my focus is..."',
          objective_en: 'Master accurate progress report phrases: "Yesterday, I wrapped up..." and "Today, my focus is..."',
          warm_up_question: 'In your daily standup, how do you clearly explain what you finished yesterday?',
          key_phrases: ['Yesterday, I wrapped up...', 'Today, my main priority is...', 'No blockers on my end.'],
          image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (workplace01 as unknown as DailyLessonContent).grammar,
        grammar_en: workplaceGrammar01_en,
        expressions: (workplace01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (workplace01 as unknown as DailyLessonContent).listening,
        speaking: (workplace01 as unknown as DailyLessonContent).speaking,
      },
      2: {
        stage_day: 2,
        stage_title: 'Giai đoạn 2: Đào sâu & Tương tác (Thảo luận & Phối hợp nhóm)',
        stage_title_en: 'Stage 2: Deep Dive & Interaction (Discussion & Team Sync)',
        stage_subtitle: 'Đưa ra ý kiến đóng góp, phản hồi lịch sự và sắp xếp cuộc họp riêng (sync).',
        stage_subtitle_en: 'Contribute ideas, give polite feedback, and propose a quick sync meeting.',
        warmup: {
          situation: 'Bạn cần thảo luận kỹ hơn về tính năng mới với đồng nghiệp và đề xuất một buổi họp ngắn 15 phút (quick sync).',
          situation_en: 'You need to discuss a new feature in more detail with a teammate and suggest a 15-minute quick sync.',
          objective: 'Sử dụng các mẫu câu đề xuất lịch sự: "Let\'s take this offline" và "Can we do a quick sync?"',
          objective_en: 'Use polite suggestion phrases: "Let\'s take this offline" and "Can we do a quick sync?"',
          warm_up_question: 'How do you ask a colleague for a 15-minute quick sync to discuss a task?',
          key_phrases: ['Let\'s do a quick sync.', 'Could we take this offline?', 'I totally agree with your proposal.'],
          image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (workplace01 as unknown as DailyLessonContent).grammar,
        grammar_en: workplaceGrammar01_en,
        expressions: (workplace01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (workplace01 as unknown as DailyLessonContent).listening,
        speaking: (workplace01 as unknown as DailyLessonContent).speaking,
      },
      3: {
        stage_day: 3,
        stage_title: 'Giai đoạn 3: Xử lý tình huống & Thử thách phản xạ (Giải quyết trở ngại Blockers)',
        stage_title_en: 'Stage 3: Handling Situations & Reflex Challenge (Resolving Blockers)',
        stage_subtitle: 'Báo cáo khó khăn cần hỗ trợ, xử lý chậm deadline và thống nhất phương án thay thế.',
        stage_subtitle_en: 'Report blockers requiring support, address deadline risks, and align on workarounds.',
        warmup: {
          situation: 'Dự án gặp sự cố kỹ thuật hoặc bạn đang chờ phản hồi từ phía khách hàng nên bị nghẽn (blocked). Bạn cần báo cáo rõ ràng với PM.',
          situation_en: 'The project hits a technical snag or you are waiting on a client response. You need to clearly report the blocker to your PM.',
          objective: 'Tự tin trình bày khó khăn và đề xuất giải pháp thay thế một cách chuyên nghiệp.',
          objective_en: 'Confidently describe obstacles and present professional workaround solutions.',
          warm_up_question: 'How do you explain to your manager that your task is blocked by a third party?',
          key_phrases: ['I am currently blocked by...', 'We might miss the deadline unless...', 'Here is my suggested workaround.'],
          image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (workplace01 as unknown as DailyLessonContent).grammar,
        grammar_en: workplaceGrammar01_en,
        expressions: (workplace01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (workplace01 as unknown as DailyLessonContent).listening,
        speaking: (workplace01 as unknown as DailyLessonContent).speaking,
      },
    },
    grammar_quizzes: [
      {
        question: "Which sentence correctly reports work completed yesterday in a standup?",
        options: [
          "Yesterday, I finish the code.",
          "Yesterday, I wrapped up the user authentication flow.",
          "Yesterday will finish.",
          "Yesterday I am finishing."
        ],
        correct_answer: 1,
        explanation: "Thì quá khứ đơn với cụm động từ chuẩn xác: 'wrapped up' (đã hoàn thành gọn gàng).",
        explanation_en: "Past simple tense with phrasal verb: 'wrapped up' (completed neatly).",
      },
    ],
  },

  'col-shopping': {
    collection_id: 'col-shopping',
    title: 'Shopping & Malls Reflexes',
    title_en: 'Shopping & Malls Reflexes',
    topic: 'Shopping & Bargaining',
    topic_en: 'Shopping & Bargaining',
    level: 'A2',
    estimated_minutes: 30,
    image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    stages: {
      1: {
        stage_day: 1,
        stage_title: 'Giai đoạn 1: Khởi động & Nền tảng (Tìm kiếm đồ & Hỏi kích cỡ)',
        stage_title_en: 'Stage 1: Warm-up & Foundation (Finding Items & Asking for Sizes)',
        stage_subtitle: 'Hỏi nhân viên về size vừa vặn, màu sắc và vị trí phòng thay đồ.',
        stage_subtitle_en: 'Ask sales staff for the right size, color availability, and the fitting rooms.',
        warmup: {
          situation: 'Bạn đang đi mua sắm quần áo tại một trung tâm thương mại. Bạn muốn hỏi nhân viên về size vừa vặn và phòng thử đồ.',
          situation_en: 'You are shopping for clothes in a mall. You want to ask the staff for your size and the location of the fitting rooms.',
          objective: 'Tự tin hỏi: "Do you have this in medium?" và "Where are the fitting rooms?"',
          objective_en: 'Confidently ask: "Do you have this in medium?" and "Where are the fitting rooms?"',
          warm_up_question: 'When shopping for clothes, how do you ask if they have a shirt in one size larger or smaller?',
          key_phrases: ['Do you have this in medium?', 'Where are the fitting rooms?', 'Can I try this on?'],
          image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (shopping01 as unknown as DailyLessonContent).grammar,
        grammar_en: shoppingGrammar01_en,
        expressions: (shopping01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (shopping01 as unknown as DailyLessonContent).listening,
        speaking: (shopping01 as unknown as DailyLessonContent).speaking,
      },
      2: {
        stage_day: 2,
        stage_title: 'Giai đoạn 2: Đào sâu & Tương tác (Hỏi giá & Khuyến mãi)',
        stage_title_en: 'Stage 2: Deep Dive & Interaction (Asking Prices & Discounts)',
        stage_subtitle: 'Hỏi mức giá, các chương trình giảm giá (discounts) và thử phụ kiện.',
        stage_subtitle_en: 'Ask for pricing, ongoing discount promotions, and try on accessories.',
        warmup: {
          situation: 'Bạn tìm thấy một món đồ ưng ý nhưng không thấy gắn mác giá. Bạn muốn hỏi giá và kiểm tra xem có ưu đãi giảm giá nào không.',
          situation_en: 'You find an item you like without a price tag. You want to ask how much it costs and check for special discounts.',
          objective: 'Nắm vững các mẫu câu hỏi giá và khuyến mãi: "How much is this?" và "Is this item on sale?"',
          objective_en: 'Master pricing and discount phrases: "How much is this?" and "Is this item on sale?"',
          warm_up_question: 'How do you ask if there is a discount or sale promotion for this item?',
          key_phrases: ['How much does this cost?', 'Is this on sale?', 'Do you have any discounts today?'],
          image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (shopping01 as unknown as DailyLessonContent).grammar,
        grammar_en: shoppingGrammar01_en,
        expressions: (shopping01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (shopping01 as unknown as DailyLessonContent).listening,
        speaking: (shopping01 as unknown as DailyLessonContent).speaking,
      },
      3: {
        stage_day: 3,
        stage_title: 'Giai đoạn 3: Xử lý tình huống & Thử thách phản xạ (Thanh toán & Đổi trả hàng)',
        stage_title_en: 'Stage 3: Handling Situations & Reflex Challenge (Checkout & Returns)',
        stage_subtitle: 'Thanh toán tại quầy thu ngân, lấy hóa đơn và hỏi chính sách đổi trả hàng.',
        stage_subtitle_en: 'Pay at the cashier, request a receipt, and ask about return & exchange policies.',
        warmup: {
          situation: 'Bạn ra quầy thu ngân để thanh toán bằng thẻ tín dụng và hỏi về chính sách đổi trả hàng trong vòng 7 ngày nếu bị lỗi.',
          situation_en: 'You head to the register to pay by card and inquire about the 7-day return policy in case the size does not fit.',
          objective: 'Thành thạo đối thoại thanh toán và đổi trả: "What is your return policy?"',
          objective_en: 'Master payment and return dialogs: "What is your return policy?"',
          warm_up_question: 'How do you ask if you can exchange or return an item if it does not fit?',
          key_phrases: ['Could I get a receipt, please?', 'What is your return policy?', 'Can I pay by credit card?'],
          image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (shopping01 as unknown as DailyLessonContent).grammar,
        grammar_en: shoppingGrammar01_en,
        expressions: (shopping01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (shopping01 as unknown as DailyLessonContent).listening,
        speaking: (shopping01 as unknown as DailyLessonContent).speaking,
      },
    },
    grammar_quizzes: [
      {
        question: "If an item of clothing is 'a bit too tight', what should you politely request?",
        options: ["One size down", "One size up", "A smaller shoe", "No size"],
        correct_answer: 1,
        explanation: "Khi áo/quần bị chật (tight), bạn cần xin tăng lên một cỡ ('one size up').",
        explanation_en: "When clothing is too tight, you request 'one size up' (a larger size).",
      },
      {
        question: "Complete the sentence: 'Can I try this denim jacket ______ before buying?'",
        options: ["on", "in", "up", "at"],
        correct_answer: 0,
        explanation: "Cụm động từ: 'try on' nghĩa là mặc thử đồ.",
        explanation_en: "The phrasal verb 'try on' means to test whether clothes fit.",
      },
    ],
  },

  'col-daily-conversations': {
    collection_id: 'col-daily-conversations',
    title: 'Daily Life & Social Conversations',
    title_en: 'Daily Life & Social Conversations',
    topic: 'Casual Social Catch-up',
    topic_en: 'Casual Social Catch-up',
    level: 'A2',
    estimated_minutes: 30,
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    stages: {
      1: {
        stage_day: 1,
        stage_title: 'Giai đoạn 1: Khởi động & Nền tảng (Chào hỏi bạn cũ tự nhiên)',
        stage_title_en: 'Stage 1: Warm-up & Foundation (Catching Up with an Old Friend)',
        stage_subtitle: 'Tình cờ gặp lại bạn cũ, chào hỏi tự nhiên và mở đầu câu chuyện hàn huyên.',
        stage_subtitle_en: 'Run into an old friend, exchange warm greetings, and start catching up.',
        warmup: {
          situation: 'Bạn tình cờ gặp lại một người bạn cũ tại quán cà phê sau nhiều năm. Cả hai bất ngờ và hào hứng chào nhau.',
          situation_en: 'You bump into an old friend at a coffee shop after many years. Both of you are surprised and excited to catch up.',
          objective: "Tự nhiên chào hỏi bạn bè: 'Long time no see!', 'What have you been up to?'",
          objective_en: "Naturally greet friends: 'Long time no see!', 'What have you been up to?'",
          warm_up_question: 'When you run into an old friend, what is your favorite greeting to start the conversation?',
          key_phrases: ['Long time no see!', 'What have you been up to lately?', 'What a pleasant surprise!'],
          image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (daily01 as unknown as DailyLessonContent).grammar,
        grammar_en: dailyGrammar01_en,
        expressions: (daily01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (daily01 as unknown as DailyLessonContent).listening,
        speaking: (daily01 as unknown as DailyLessonContent).speaking,
      },
      2: {
        stage_day: 2,
        stage_title: 'Giai đoạn 2: Đào sâu & Tương tác (Hỏi thăm cuộc sống & Công việc)',
        stage_title_en: 'Stage 2: Deep Dive & Interaction (Life & Work Catch-up)',
        stage_subtitle: 'Chia sẻ về những thay đổi gần đây trong cuộc sống và hỏi thăm gia đình bạn bè.',
        stage_subtitle_en: 'Share recent life milestones, ask about family, and discuss current work.',
        warmup: {
          situation: 'Hai bạn cùng ngồi lại uống nước và chia sẻ về công việc hiện tại, nơi ở mới và các dự định sắp tới.',
          situation_en: 'You sit down for drinks to talk about work, your new place, and upcoming plans.',
          objective: 'Sử dụng thì hiện tại hoàn thành để hỏi và kể về những trải nghiệm gần đây.',
          objective_en: 'Use the present perfect tense to discuss and inquire about recent experiences.',
          warm_up_question: 'How do you ask about someone\'s family and recent work in a warm, friendly way?',
          key_phrases: ['How is work and family going?', 'I recently moved to a new apartment.', 'Are you still working at...?'],
          image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (daily01 as unknown as DailyLessonContent).grammar,
        grammar_en: dailyGrammar01_en,
        expressions: (daily01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (daily01 as unknown as DailyLessonContent).listening,
        speaking: (daily01 as unknown as DailyLessonContent).speaking,
      },
      3: {
        stage_day: 3,
        stage_title: 'Giai đoạn 3: Xử lý tình huống & Thử thách phản xạ (Hẹn gặp lại & Giữ liên lạc)',
        stage_title_en: 'Stage 3: Handling Situations & Reflex Challenge (Future Plans & Staying in Touch)',
        stage_subtitle: 'Rủ bạn đi cà phê cuối tuần, trao đổi số điện thoại và kết nối mạng xã hội.',
        stage_subtitle_en: 'Suggest weekend coffee, exchange phone numbers, and stay connected.',
        warmup: {
          situation: 'Đến giờ phải chia tay để đi làm tiếp. Hai bạn trao đổi số Zalo/điện thoại và hẹn nhau đi ăn tối vào thứ Bảy.',
          situation_en: 'It is time to part ways for work. You exchange contact details and schedule dinner for this Saturday.',
          objective: 'Làm chủ các mẫu câu hẹn hò gặp gỡ: "Let\'s grab a coffee soon!" và "We must keep in touch!"',
          objective_en: 'Master phrases for reconnecting: "Let\'s grab a coffee soon!" and "We should keep in touch!"',
          warm_up_question: 'How do you suggest meeting up again soon before saying goodbye?',
          key_phrases: ['Let\'s grab a coffee soon!', 'We should definitely keep in touch!', 'Text me when you are free!'],
          image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        },
        grammar: (daily01 as unknown as DailyLessonContent).grammar,
        grammar_en: dailyGrammar01_en,
        expressions: (daily01 as unknown as DailyLessonContent).expressions.slice(0, 4),
        listening: (daily01 as unknown as DailyLessonContent).listening,
        speaking: (daily01 as unknown as DailyLessonContent).speaking,
      },
    },
    grammar_quizzes: [
      {
        question: "Which question naturally asks a friend about their recent life updates?",
        options: [
          "What have you been up to lately?",
          "What you do now yesterday?",
          "Why are you standing?",
          "How do you do yesterday?"
        ],
        correct_answer: 0,
        explanation: "'What have you been up to lately?' là câu hỏi tự nhiên nhất để hỏi thăm cuộc sống gần đây.",
        explanation_en: "'What have you been up to lately?' is the most natural way to ask about recent life updates.",
      },
      {
        question: "Complete the common informal greeting: '______ time no see!'",
        options: ["Long", "Big", "High", "Far"],
        correct_answer: 0,
        explanation: "Thành ngữ chuẩn là: 'Long time no see!' (Lâu ngày không gặp!).",
        explanation_en: "The standard idiom is 'Long time no see!' (greeting after a long absence).",
      },
    ],
  },
};

// Aliases cho các ID cũ để tương thích ngược 100%
SPRINT_TEMPLATES['deck-restaurant'] = SPRINT_TEMPLATES['col-restaurant'];
SPRINT_TEMPLATES['deck-travel'] = SPRINT_TEMPLATES['col-travel'];
SPRINT_TEMPLATES['deck-workplace'] = SPRINT_TEMPLATES['col-workplace'];
SPRINT_TEMPLATES['deck-shopping'] = SPRINT_TEMPLATES['col-shopping'];
SPRINT_TEMPLATES['deck-daily-conversations'] = SPRINT_TEMPLATES['col-daily-conversations'];

// Tương thích ngược DECK_TEMPLATES
export const DECK_TEMPLATES = SPRINT_TEMPLATES;

/**
 * Trộn ngẫu nhiên mảng (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Thu thập toàn bộ từ vựng cho một Collection từ mọi nguồn dữ liệu
 */
export function getAllVocabForCollection(collectionId: string): LessonVocabItem[] {
  const result: LessonVocabItem[] = [];
  const seenWords = new Set<string>();

  // Chuẩn hóa key
  const cleanKey = collectionId.replace(/^deck-/, '').replace(/^col-/, '');
  const colKey = `col-${cleanKey}`;

  // 1. Nguồn từ sampleCollectionItems
  const colItems =
    sampleCollectionItems[collectionId] ||
    sampleCollectionItems[colKey] ||
    sampleCollectionItems[cleanKey] ||
    [];
  for (const item of colItems) {
    const norm = (item.english_text || '').trim().toLowerCase();
    if (norm && !seenWords.has(norm)) {
      seenWords.add(norm);
      result.push({
        id: item.id || `col-item-${norm}`,
        word: item.english_text,
        phonetic_ipa: item.phonetic_ipa || '',
        part_of_speech: item.type || 'phrase',
        vietnamese_meaning: item.vietnamese_meaning || '',
        collocations: [],
        example_sentence: item.example_sentence || '',
        example_meaning: item.example_meaning || '',
        sprint_day: (item.sprint_day as 1 | 2 | 3) || 1,
      });
    }
  }

  // 2. Nguồn từ các bài học mẫu JSON
  const lessonSourceMap: Record<string, DailyLessonContent[]> = {
    'col-restaurant': [restaurant01 as unknown as DailyLessonContent, restaurant02 as unknown as DailyLessonContent],
    'col-travel': [travel01 as unknown as DailyLessonContent, travel02 as unknown as DailyLessonContent],
    'col-workplace': [workplace01 as unknown as DailyLessonContent],
    'col-shopping': [shopping01 as unknown as DailyLessonContent],
    'col-daily-conversations': [daily01 as unknown as DailyLessonContent],
  };

  const sampleLessons = lessonSourceMap[colKey] || [];
  for (const l of sampleLessons) {
    if (l.vocabulary) {
      for (const v of l.vocabulary) {
        const norm = v.word.trim().toLowerCase();
        if (!seenWords.has(norm)) {
          seenWords.add(norm);
          result.push(v);
        }
      }
    }
  }

  // 3. Nguồn từ dailyItemsJson nếu là daily-conversations
  if (cleanKey === 'daily-conversations' && Array.isArray(dailyItemsJson)) {
    for (const item of dailyItemsJson as any[]) {
      const norm = (item.english_text || '').trim().toLowerCase();
      if (norm && !seenWords.has(norm)) {
        seenWords.add(norm);
        result.push({
          id: item.id || `vocab-${norm}`,
          word: item.english_text,
          phonetic_ipa: item.phonetic_ipa || '',
          part_of_speech: item.type || 'word',
          vietnamese_meaning: item.vietnamese_meaning || '',
          collocations: item.collocations || [],
          example_sentence: item.example_sentence || '',
          example_meaning: item.example_meaning || '',
        });
      }
    }
  }

  // 4. Fallback từ sampleLearningItems (tương thích ngược)
  const mockItems = sampleLearningItems[`deck-${cleanKey}`] || sampleLearningItems[collectionId] || [];
  for (const item of mockItems) {
    const norm = (item.english_text || '').trim().toLowerCase();
    if (norm && !seenWords.has(norm)) {
      seenWords.add(norm);
      result.push({
        id: item.id || `mock-${norm}`,
        word: item.english_text,
        phonetic_ipa: item.phonetic_ipa || '',
        part_of_speech: item.type || 'phrase',
        vietnamese_meaning: item.vietnamese_meaning || '',
        collocations: (item as any).collocations || [],
        example_sentence: item.example_sentence || '',
        example_meaning: item.example_meaning || '',
      });
    }
  }

  return result;
}

// Alias tương thích ngược
export const getAllVocabForDeck = getAllVocabForCollection;

/**
 * Tự động sinh bộ câu hỏi Practice trắc nghiệm, ghép câu, dịch thuật (Test cả từ mới và từ ôn tập 70/30)
 * Hỗ trợ chuyển đổi song ngữ (Tiếng Việt và Tiếng Anh)
 */
function generateDynamicPracticeQuestions(
  selectedVocab: LessonVocabItem[],
  allDeckVocab: LessonVocabItem[],
  grammarQuizzes: { question: string; options: string[]; correct_answer: number; explanation?: string; explanation_en?: string }[],
  topicExpressions: LessonExpression[],
  lang: 'vi' | 'en' = 'vi'
): PracticeQuizItem[] {
  const practice: PracticeQuizItem[] = [];

  // Tách từ mới và từ ôn tập
  const reviewWords = selectedVocab.filter((v) => v.is_review);
  const newWords = selectedVocab.filter((v) => !v.is_review);

  // 1. Hai câu trắc nghiệm từ vựng: Ưu tiên 1 câu từ ôn tập 70/30 và 1 câu từ mới
  const quizTargets: LessonVocabItem[] = [];
  if (reviewWords.length > 0) quizTargets.push(reviewWords[0]);
  if (newWords.length > 0) quizTargets.push(newWords[0]);
  if (quizTargets.length < 2 && selectedVocab.length >= 2) {
    quizTargets.push(selectedVocab[1]);
  }

  quizTargets.slice(0, 2).forEach((targetWord, idx) => {
    const otherWords = allDeckVocab.filter((w) => w.word !== targetWord.word);
    const distractors = shuffle(otherWords).slice(0, 3).map((w) => w.vietnamese_meaning);

    const allOptions = shuffle([targetWord.vietnamese_meaning, ...distractors]);
    const correctIndex = allOptions.indexOf(targetWord.vietnamese_meaning);

    const tag = targetWord.is_review
      ? lang === 'en'
        ? '[Review 70/30] '
        : '[Ôn tập 70/30] '
      : '';

    practice.push({
      id: `dpq-vocab-${idx + 1}`,
      type: 'vocabulary_quiz',
      question:
        lang === 'en'
          ? `${tag}What is the correct meaning of the word/phrase "${targetWord.word}"?`
          : `${tag}Nghĩa chính xác của từ/cụm từ "${targetWord.word}" là gì?`,
      options: allOptions,
      correct_answer: correctIndex >= 0 ? correctIndex : 0,
      explanation:
        lang === 'en'
          ? `"${targetWord.word}" means: ${targetWord.vietnamese_meaning}. Example: ${targetWord.example_sentence}`
          : `"${targetWord.word}" có nghĩa là: ${targetWord.vietnamese_meaning}. Ví dụ: ${targetWord.example_sentence}`,
    });
  });

  // 2. Hai câu hỏi ngữ pháp
  if (grammarQuizzes && grammarQuizzes.length > 0) {
    grammarQuizzes.slice(0, 2).forEach((gq, idx) => {
      practice.push({
        id: `dpq-grammar-${idx + 1}`,
        type: 'grammar_quiz',
        question: gq.question,
        options: gq.options,
        correct_answer: gq.correct_answer,
        explanation: lang === 'en' && gq.explanation_en ? gq.explanation_en : gq.explanation,
      });
    });
  }

  // 3. Hai câu xếp từ thành câu (Sentence Building)
  const wordsWithExamples = selectedVocab.filter(
    (w) => w.example_sentence && w.example_sentence.split(' ').length >= 4 && w.example_sentence.split(' ').length <= 12
  );
  const sentenceTargets = shuffle(wordsWithExamples).slice(0, 2);

  sentenceTargets.forEach((st, idx) => {
    const rawWords = st.example_sentence.replace(/[.,?!]/g, '').split(' ');
    const correctOrder = rawWords;
    const scrambled = shuffle([...rawWords]);

    practice.push({
      id: `dpq-build-${idx + 1}`,
      type: 'sentence_building',
      vietnamese:
        lang === 'en'
          ? st.example_meaning
            ? `Target meaning: "${st.example_meaning}"`
            : `Arrange the words to form a correct sentence with "${st.word}"`
          : st.example_meaning || `Sắp xếp các từ để hoàn thiện câu với "${st.word}"`,
      scrambled_words: scrambled,
      correct_order: correctOrder,
      hint:
        lang === 'en'
          ? `Hint: The sentence begins with "${correctOrder[0]}"`
          : `Gợi ý: Câu bắt đầu bằng "${correctOrder[0]}"`,
    });
  });

  // 4. Một câu dịch thuật (Translation)
  if (topicExpressions.length > 0) {
    const expr = topicExpressions[0];
    practice.push({
      id: 'dpq-translate-1',
      type: 'translation',
      source_text: expr.meaning,
      source_lang: 'vi',
      correct_answer: expr.expression,
      accept_answers: [
        expr.expression,
        expr.expression.replace(/[.,?!]/g, '').trim(),
        ...(expr.variations || []),
      ],
      hint:
        lang === 'en'
          ? `Hint: Use the pattern "${expr.expression}"`
          : `Gợi ý: Dùng mẫu câu "${expr.expression}"`,
    });
  }

  // 5. Một thử thách nói phản xạ (Speaking Challenge)
  const challengeWord = selectedVocab[0] || { word: 'hello', example_sentence: 'Hello, nice to meet you.' };
  practice.push({
    id: 'dpq-speak-1',
    type: 'speaking_challenge',
    prompt:
      lang === 'en'
        ? `Use the word/phrase "${challengeWord.word}" to say a natural communication sentence in today's context.`
        : `Hãy sử dụng từ/mẫu câu "${challengeWord.word}" để nói một câu giao tiếp tự nhiên trong tình huống hôm nay.`,
    sample_answer: challengeWord.example_sentence || challengeWord.word,
    vietnamese_hint:
      challengeWord.example_meaning ||
      (lang === 'en' ? `Say a sentence containing: ${challengeWord.word}` : `Nói câu có chứa: ${challengeWord.word}`),
  });

  return practice;
}

/**
 * =========================================================================
 * HYBRID THEMATIC SPRINT GENERATOR (Chuyên đề 3 ngày + Quy tắc 70/30)
 * =========================================================================
 * 1. Chuyên đề (Thematic Sprint): 3 ngày liên tục cho 1 chủ đề (Foundation -> Interaction -> Challenge).
 * 2. Quy tắc 70/30:
 *    - 7 từ mới (70%): Lấy từ kho từ vựng của giai đoạn hiện tại.
 *    - 3 từ ôn tập (30%): Lấy từ các từ ĐÃ HỌC ở ngày trước để kích hoạt Spaced Retrieval.
 * 3. Hỗ trợ đa ngôn ngữ: Tiếng Việt và Tiếng Anh (song ngữ chuẩn).
 */
export function generateHybridDailyLesson(options: DailyLessonGeneratorOptions = {}): DailyLessonContent {
  const lang = getEffectiveLanguage(options.language);
  const dateStr = options.dateStr || new Date().toISOString().split('T')[0];
  const masteredSet = new Set<string>((options.userMasteredIds || []).map((id) => id.toLowerCase()));

  // 1. Tính toán Sprint và Ngày trong chu kỳ 3 ngày (Day 1, Day 2, Day 3)
  const SPRINT_DAYS_COUNT = 3;
  // Dùng dateStr tính số ngày epoch để chu kỳ 3 ngày luôn đồng bộ và cố định trong ngày
  const dateObj = new Date(dateStr);
  const epochDays = Math.floor(dateObj.getTime() / (1000 * 60 * 60 * 24));
  const sprintCycleIndex = Math.floor(epochDays / SPRINT_DAYS_COUNT);

  // Xác định ngày trong sprint: 1, 2 hoặc 3
  const calculatedSprintDay = ((epochDays % SPRINT_DAYS_COUNT) + 1) as 1 | 2 | 3;
  const sprintDay = options.sprintDay || calculatedSprintDay;

  // Xác định Collection của Sprint
  let targetCollectionKey = options.collectionId || options.deckId;
  if (!targetCollectionKey || !SPRINT_TEMPLATES[targetCollectionKey]) {
    const colIndex = Math.abs(sprintCycleIndex) % THEMATIC_SPRINT_ORDER.length;
    targetCollectionKey = THEMATIC_SPRINT_ORDER[colIndex];
  }

  const template = SPRINT_TEMPLATES[targetCollectionKey] || SPRINT_TEMPLATES['col-restaurant'];
  const stage = template.stages[sprintDay] || template.stages[1];

  // 2. Thu thập toàn bộ từ vựng của Collection này
  const allCollectionVocab = getAllVocabForCollection(targetCollectionKey);

  // 3. Phân loại từ vựng thành: Từ CHƯA HỌC (New) và Từ ĐÃ HỌC (Learned/Review)
  const unlearnedVocab = allCollectionVocab.filter((v) => {
    const normWord = v.word.trim().toLowerCase();
    const idNorm = (v.id || '').toLowerCase();
    return !masteredSet.has(idNorm) && !masteredSet.has(normWord);
  });

  const learnedVocab = allCollectionVocab.filter((v) => {
    const normWord = v.word.trim().toLowerCase();
    const idNorm = (v.id || '').toLowerCase();
    return masteredSet.has(idNorm) || masteredSet.has(normWord);
  });

  // 4. ÁP DỤNG QUY TẮC 70/30 (7 từ mới + 3 từ ôn tập)
  const TARGET_NEW = 7;
  const TARGET_REVIEW = 3;

  let newWords: LessonVocabItem[] = [];
  let reviewWords: LessonVocabItem[] = [];

  // 4A. Chọn 7 từ mới (70%)
  if (unlearnedVocab.length >= TARGET_NEW) {
    newWords = shuffle(unlearnedVocab).slice(0, TARGET_NEW).map((v) => ({
      ...v,
      is_review: false,
      sprint_day: sprintDay,
    }));
  } else if (unlearnedVocab.length > 0) {
    newWords = unlearnedVocab.map((v) => ({
      ...v,
      is_review: false,
      sprint_day: sprintDay,
    }));
  } else {
    // Nếu người dùng đã học hết kho từ: bốc 7 từ để tiếp tục rèn luyện
    newWords = shuffle(allCollectionVocab).slice(0, TARGET_NEW).map((v) => ({
      ...v,
      is_review: false,
      sprint_day: sprintDay,
    }));
  }

  // 4B. Chọn 3 từ ôn tập (30%)
  const reviewNeeded = 10 - newWords.length;
  if (reviewNeeded > 0) {
    if (learnedVocab.length >= reviewNeeded) {
      reviewWords = shuffle(learnedVocab).slice(0, reviewNeeded).map((v) => ({
        ...v,
        is_review: true,
        sprint_day: sprintDay,
      }));
    } else if (learnedVocab.length > 0) {
      reviewWords = learnedVocab.map((v) => ({
        ...v,
        is_review: true,
        sprint_day: sprintDay,
      }));
    } else {
      // Trường hợp người dùng mới tinh chưa học từ nào trước đó:
      // Bổ sung thêm từ mới từ unlearnedVocab để đủ 10 từ
      const remainingUnlearned = unlearnedVocab.filter((u) => !newWords.some((nw) => nw.id === u.id));
      const extraNew = shuffle(remainingUnlearned).slice(0, reviewNeeded).map((v) => ({
        ...v,
        is_review: false,
        sprint_day: sprintDay,
      }));
      newWords = [...newWords, ...extraNew];
    }
  }

  const selectedVocab = [...newWords, ...reviewWords];

  // 5. Ghép kịch bản giai đoạn (Stage) của ngày hôm nay theo ngôn ngữ
  const stageTitle = lang === 'en' && stage.stage_title_en ? stage.stage_title_en : stage.stage_title;
  const stageSubtitle = lang === 'en' && stage.stage_subtitle_en ? stage.stage_subtitle_en : stage.stage_subtitle;
  const situation = lang === 'en' && stage.warmup.situation_en ? stage.warmup.situation_en : stage.warmup.situation;
  const objective = lang === 'en' && stage.warmup.objective_en ? stage.warmup.objective_en : stage.warmup.objective;
  const grammar = lang === 'en' && stage.grammar_en ? stage.grammar_en : stage.grammar;
  const expressions = stage.expressions;
  const listening = stage.listening;
  const speaking = stage.speaking;

  // 6. Sinh động 8 câu hỏi luyện tập (Step 7) phù hợp với ngôn ngữ đã chọn
  const practiceQuestions = generateDynamicPracticeQuestions(
    selectedVocab,
    allCollectionVocab,
    template.grammar_quizzes,
    expressions,
    lang
  );

  // 7. Tạo đối tượng DailyLesson hoàn chỉnh kèm metadata Thematic Sprint
  const dynamicLessonMeta: DailyLesson = {
    id: `lesson-dynamic-${template.collection_id}-${dateStr}`,
    deck_id: template.collection_id, // Tương thích ngược
    collection_id: template.collection_id,
    title: lang === 'en' ? `${template.title} (Day ${sprintDay}/3)` : `${template.title} (Ngày ${sprintDay}/3)`,
    description:
      lang === 'en'
        ? `${stageSubtitle} • Goal: 10 words (7 new words + 3 review words).`
        : `${stageSubtitle} • Mục tiêu 10 từ (7 từ mới + 3 từ ôn tập củng cố).`,
    topic: template.topic,
    level: template.level,
    estimated_minutes: template.estimated_minutes,
    order_index: sprintDay,
    image_url: template.image_url,
    sprint_day: sprintDay,
    sprint_total_days: 3,
    stage_title: stageTitle,
    stage_title_en: stage.stage_title_en,
    description_en: `${stage.stage_subtitle_en || stageSubtitle} • Goal: 10 words (7 new words + 3 review words).`,
  };

  const dynamicWarmup: LessonWarmup = {
    situation,
    objective,
    warm_up_question: stage.warmup.warm_up_question,
    key_phrases: selectedVocab.slice(0, 4).map((v) => v.word),
    image_url: stage.warmup.image_url,
  };

  return {
    lesson: dynamicLessonMeta,
    warmup: dynamicWarmup,
    vocabulary: selectedVocab,
    grammar,
    expressions,
    listening,
    speaking,
    practice: practiceQuestions,
    language: lang,
  };
}

/**
 * =========================================================================
 * PHƯƠNG ÁN 2: AI-POWERED GENERATOR (Gemini API Integration Interface)
 * =========================================================================
 */
export async function generateLessonWithAI(options: DailyLessonGeneratorOptions = {}): Promise<DailyLessonContent> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const lang = getEffectiveLanguage(options.language);

  if (!apiKey) {
    console.info(
      '[DailyLessonGenerator] Chế độ AI được gọi nhưng chưa cấu hình VITE_GEMINI_API_KEY. Tự động chuyển đổi sang Hybrid Generator (Phương án 1).'
    );
    return generateHybridDailyLesson(options);
  }

  try {
    const dateStr = options.dateStr || new Date().toISOString().split('T')[0];
    const colId = options.collectionId || options.deckId || 'col-travel';
    const allVocab = getAllVocabForCollection(colId);
    const targetWords = shuffle(allVocab).slice(0, 10).map((w) => w.word);

    const langInstruction =
      lang === 'en'
        ? 'Provide scenarios, objectives, grammar explanations, hints, and quiz questions in English.'
        : 'Provide scenarios, objectives, grammar explanations, hints, and quiz questions in Vietnamese for Vietnamese learners of English.';

    const prompt = `You are an elite ESL communication teacher.
Generate a structured 7-step English communication daily lesson in valid JSON matching the following schema:
Topic: "${colId}"
Target Words: [${targetWords.join(', ')}]
Language: "${lang === 'en' ? 'English' : 'Vietnamese'}" (${langInstruction})
Requirements:
1. warmup: realistic scenario, objective, warm-up question, key phrases.
2. vocabulary: exactly 10 words with IPA, part of speech, vietnamese meaning, collocations, example sentences.
3. grammar: clear rule, formula, 3 examples, 2 common mistakes with explanations.
4. expressions: 4 natural phrases with IPA and variations.
5. listening: a 6-turn dialogue using the target words, plus 3 comprehension questions.
6. speaking: practical reflex sentences.
7. practice: 8 questions (vocabulary quiz, grammar quiz, sentence building, translation, speaking challenge).
Output ONLY the raw JSON object with keys: lesson, warmup, vocabulary, grammar, expressions, listening, speaking, practice.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (jsonText) {
      const parsed = JSON.parse(jsonText) as DailyLessonContent;
      parsed.lesson.id = `lesson-ai-${colId}-${dateStr}`;
      parsed.language = lang;
      return parsed;
    }

    throw new Error('Empty AI response');
  } catch (err) {
    console.warn('[DailyLessonGenerator] Lỗi khi tạo bài học bằng AI. Fallback sang Hybrid Generator:', err);
    return generateHybridDailyLesson(options);
  }
}

/**
 * =========================================================================
 * HÀM ĐIỀU PHỐI CHÍNH: LẤY HOẶC TẠO MỚI BÀI HỌC CỦA NGÀY (CÓ CACHE SONG NGỮ)
 * =========================================================================
 */
export async function getOrGenerateTodayDailyLesson(
  options: DailyLessonGeneratorOptions = {}
): Promise<DailyLessonContent> {
  const lang = getEffectiveLanguage(options.language);
  const dateStr = options.dateStr || new Date().toISOString().split('T')[0];
  const cacheKey = `speakup_daily_lesson_${dateStr}_${lang}`;

  if (!options.forceRegenerate) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as DailyLessonContent;
        if (parsed && parsed.lesson && parsed.vocabulary) {
          return parsed;
        }
      }
      // Fallback kiểm tra cache key cũ nếu là tiếng Việt
      if (lang === 'vi') {
        const legacyCached = localStorage.getItem(`speakup_daily_lesson_${dateStr}`);
        if (legacyCached) {
          const parsed = JSON.parse(legacyCached) as DailyLessonContent;
          if (parsed && parsed.lesson && parsed.vocabulary) {
            return parsed;
          }
        }
      }
    } catch (_) {}
  }

  // Tạo bài học mới: Ưu tiên AI nếu được chọn, nếu không thì dùng Hybrid
  const optionsWithLang: DailyLessonGeneratorOptions = { ...options, language: lang };
  let generatedLesson: DailyLessonContent;
  if (options.mode === 'ai') {
    generatedLesson = await generateLessonWithAI(optionsWithLang);
  } else {
    generatedLesson = generateHybridDailyLesson(optionsWithLang);
  }

  generatedLesson.language = lang;

  // Lưu cache cho ngày hôm nay theo từng ngôn ngữ
  try {
    localStorage.setItem(cacheKey, JSON.stringify(generatedLesson));
    if (lang === 'vi') {
      localStorage.setItem(`speakup_daily_lesson_${dateStr}`, JSON.stringify(generatedLesson));
    }
  } catch (_) {}

  return generatedLesson;
}

/**
 * Localize nội dung bài học tĩnh hoặc bài học đã nạp sang ngôn ngữ mong muốn
 */
export function localizeLessonContent(
  content: DailyLessonContent,
  lang: 'vi' | 'en' = 'vi'
): DailyLessonContent {
  if (lang === 'vi') return content;

  // Tìm kịch bản sprint tương ứng nếu có
  const sprintDay = content.lesson.sprint_day || 1;
  const colId = content.lesson.collection_id || content.lesson.deck_id;
  const template = SPRINT_TEMPLATES[colId];
  const stage = template?.stages[sprintDay];

  const localizedLesson: DailyLesson = {
    ...content.lesson,
    title: content.lesson.title.replace(/Ngày\s*(\d+)\/(\d+)/i, 'Day $1/$2'),
    description: stage?.stage_subtitle_en
      ? `${stage.stage_subtitle_en} • Goal: 10 words (7 new words + 3 review words).`
      : content.lesson.description.replace('Mục tiêu 10 từ (7 từ mới + 3 từ ôn tập củng cố).', 'Goal: 10 words (7 new words + 3 review words).'),
    stage_title: stage?.stage_title_en || content.lesson.stage_title?.replace(/Giai đoạn\s*(\d+):/i, 'Stage $1:'),
  };

  const localizedWarmup: LessonWarmup = {
    ...content.warmup,
    situation: stage?.warmup?.situation_en || content.warmup.situation,
    objective: stage?.warmup?.objective_en || content.warmup.objective,
  };

  const localizedGrammar: LessonGrammar = stage?.grammar_en || content.grammar;

  const localizedPractice: PracticeQuizItem[] = content.practice.map((item) => {
    if (item.type === 'vocabulary_quiz') {
      const isReview = item.question.includes('[Ôn tập') || item.question.includes('[Review');
      const tag = isReview ? '[Review 70/30] ' : '';
      const wordMatch = item.question.match(/"([^"]+)"/);
      const word = wordMatch ? wordMatch[1] : '';
      return {
        ...item,
        question: word ? `${tag}What is the correct meaning of the word/phrase "${word}"?` : item.question,
        explanation: item.explanation
          ? item.explanation
              .replace(/có nghĩa là:/g, 'means:')
              .replace(/Ví dụ:/g, 'Example:')
          : item.explanation,
      };
    }
    if (item.type === 'sentence_building') {
      return {
        ...item,
        hint: item.hint
          ? item.hint.replace(/Gợi ý: Câu bắt đầu bằng/g, 'Hint: The sentence begins with')
          : item.hint,
      };
    }
    if (item.type === 'translation') {
      return {
        ...item,
        hint: item.hint
          ? item.hint.replace(/Gợi ý: Dùng mẫu câu/g, 'Hint: Use the pattern')
          : item.hint,
      };
    }
    if (item.type === 'speaking_challenge') {
      const wordMatch = item.prompt.match(/"([^"]+)"/);
      const word = wordMatch ? wordMatch[1] : '';
      return {
        ...item,
        prompt: word
          ? `Use the word/phrase "${word}" to say a natural communication sentence in today's context.`
          : item.prompt,
        vietnamese_hint: item.vietnamese_hint
          ? item.vietnamese_hint.replace(/Nói câu có chứa:/g, 'Speak a sentence containing:')
          : item.vietnamese_hint,
      };
    }
    return item;
  });

  return {
    ...content,
    lesson: localizedLesson,
    warmup: localizedWarmup,
    grammar: localizedGrammar,
    practice: localizedPractice,
    language: 'en',
  };
}

/**
 * Lấy bài học đã sinh động trong cache theo ID và ngôn ngữ (dành cho DailyLessonPage)
 */
export function getGeneratedDailyLessonById(
  lessonId: string,
  language?: 'vi' | 'en'
): DailyLessonContent | null {
  if (!lessonId.startsWith('lesson-dynamic-') && !lessonId.startsWith('lesson-ai-')) {
    return null;
  }

  const lang = getEffectiveLanguage(language);

  // 1. Tìm trong localStorage các cache key có khớp đúng ngôn ngữ
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('speakup_daily_lesson_') && key.endsWith(`_${lang}`)) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item) as DailyLessonContent;
          if (parsed && parsed.lesson && parsed.lesson.id === lessonId) {
            return parsed;
          }
        }
      } catch (_) {}
    }
  }

  // 2. Trích xuất collectionId và dateStr từ lessonId và sinh lại đúng ngôn ngữ
  const match = lessonId.match(/^lesson-(?:dynamic|ai)-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (match) {
    const colId = match[1];
    const dateStr = match[2];
    if (SPRINT_TEMPLATES[colId]) {
      const regenerated = generateHybridDailyLesson({ collectionId: colId, dateStr, language: lang });
      try {
        localStorage.setItem(`speakup_daily_lesson_${dateStr}_${lang}`, JSON.stringify(regenerated));
      } catch (_) {}
      return regenerated;
    }
  }

  // Fallback nếu không parse được regex: thử phân tách parts
  const parts = lessonId.split('-');
  const colId = parts.slice(2, parts.length - 3).join('-');
  if (colId && SPRINT_TEMPLATES[colId]) {
    return generateHybridDailyLesson({ collectionId: colId, language: lang });
  }

  return generateHybridDailyLesson({ language: lang });
}
