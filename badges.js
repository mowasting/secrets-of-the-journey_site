/* badges.js : شارات أيقونية (ستيكرات) لكل التخصصات
   الأيقونات ثابتة داخل الكود، وأي معرّف يجي من قاعدة البيانات يُعرض فقط إذا كان موجود بهذا الكتالوج. */
window.SJBadges = (function () {
  "use strict";

  var CAT = {
    medical:   { bg: "#e0546a", ar: "طب وصحة",   en: "Medical" },
    science:   { bg: "#2f9e95", ar: "علوم",       en: "Science" },
    education: { bg: "#4a78c9", ar: "دراسة",      en: "Study" },
    tech:      { bg: "#6d5bd0", ar: "هندسة وتقنية", en: "Tech" },
    law:       { bg: "#8a6d3b", ar: "قانون وأعمال", en: "Law & Business" },
    arts:      { bg: "#d46aa8", ar: "فنون",       en: "Arts" },
    general:   { bg: "#e0a526", ar: "عامة",       en: "General" },
    season:    { bg: "#2f8f4e", ar: "مواسم",      en: "Seasonal" },
    ramadan:   { bg: "#7a4fc0", ar: "رمضان",      en: "Ramadan" },
    eid:       { bg: "#1f9ab5", ar: "العيد",      en: "Eid" },
    special:   { bg: "#e0a526", ar: "خاص",        en: "Special" },
    jobs:      { bg: "#c9782b", ar: "مهن",        en: "Careers" }
  };
  var F = ' fill="#fff" stroke="none"';

  /* id, الفئة، السعر، الاسم بالعربي والإنجليزي، رسمة الأيقونة (24x24) */
  var LIST = [
    { id: "champion", cat: "general", price: 0, ar: "بطل الأسبوع", en: "Weekly champion",
      g: '<path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z"' + F + '/>' },
    /* شارة المطوّر: ذهبية، مو للبيع، تنعطى بالـSQL فقط (جدول special_badges) وتظهر تلقائياً أول الشارات */
    { id: "developer", cat: "special", price: 0, hidden: true, ar: "المطوّر", en: "The Developer",
      g: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>' },

    { id: "stethoscope", cat: "medical", price: 150, ar: "سماعة طبيب", en: "Stethoscope",
      g: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2"/>' },
    { id: "tooth", cat: "medical", price: 150, ar: "طب الأسنان", en: "Dentistry",
      g: '<path d="M8 4C5.500 4 4 6 4 8.500c0 3 1.500 4.500 2 7 .4 2.500 1 4.500 2.200 4.500S10 16 12 16s1.600 4 2.800 4 1.800-2 2.200-4.500c.5-2.500 2-4 2-7C19 6 17.500 4 15 4c-1.500 0-2 .8-3 .8S9.500 4 8 4z"/>' },
    { id: "pill", cat: "medical", price: 150, ar: "صيدلة", en: "Pharmacy",
      g: '<rect x="2.500" y="8.500" width="19" height="7" rx="3.500" transform="rotate(-45 12 12)"/><path d="M8.800 8.800l6.400 6.400"/>' },
    { id: "syringe", cat: "medical", price: 150, ar: "تمريض", en: "Nursing",
      g: '<path d="M14 4l6 6M11 7l6 6M3 21l5-5"/><path d="M8 16l9-9 3 3-9 9z"/>' },
    { id: "heartbeat", cat: "medical", price: 150, ar: "قلب", en: "Cardiology",
      g: '<path d="M2 12h5l2-5 4 10 2-5h7"/>' },
    { id: "brain", cat: "medical", price: 150, ar: "أعصاب", en: "Neurology",
      g: '<path d="M11 4.500A3 3 0 0 0 5.500 6 3 3 0 0 0 4 11a3 3 0 0 0 1.500 5.500A3 3 0 0 0 11 19z"/><path d="M13 4.500A3 3 0 0 1 18.500 6 3 3 0 0 1 20 11a3 3 0 0 1-1.500 5.500A3 3 0 0 1 13 19z"/><path d="M12 4.500v14.500"/>' },
    { id: "bone", cat: "medical", price: 150, ar: "عظام", en: "Orthopedics",
      g: '<path d="M6 8.500A2.500 2.500 0 1 1 8.500 6l7 7a2.500 2.500 0 1 1 2.500 2.500A2.500 2.500 0 1 1 15.500 18l-7-7A2.500 2.500 0 0 1 6 8.500z"/>' },
    { id: "eye", cat: "medical", price: 150, ar: "عيون", en: "Ophthalmology",
      g: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>' },
    { id: "firstaid", cat: "medical", price: 120, ar: "إسعاف", en: "First aid",
      g: '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>' },

    { id: "microscope", cat: "science", price: 120, ar: "مختبر", en: "Lab",
      g: '<path d="M8 3l4 2-3 7-4-2z"/><path d="M10.500 8.500l2 .8"/><path d="M11 13a5 5 0 0 1 4 6"/><path d="M5 20h14M8 20v-2"/>' },
    { id: "dna", cat: "science", price: 120, ar: "أحياء", en: "Biology",
      g: '<path d="M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9M9 6.500h6M9 17.500h6"/>' },
    { id: "flask", cat: "science", price: 120, ar: "كيمياء", en: "Chemistry",
      g: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.800 3h10.400A2 2 0 0 0 19 18l-5-9V3M8 15h8"/>' },
    { id: "atom", cat: "science", price: 120, ar: "فيزياء", en: "Physics",
      g: '<circle cx="12" cy="12" r="1.500"' + F + '/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>' },

    { id: "gradcap", cat: "education", price: 120, ar: "تخرج", en: "Graduation",
      g: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c0 1.500 3 3 6 3s6-1.500 6-3v-4.500"/><path d="M22 9v6"/>' },
    { id: "book", cat: "education", price: 100, ar: "كتاب", en: "Book",
      g: '<path d="M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3z"/><path d="M21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z"/>' },
    { id: "pencil", cat: "education", price: 100, ar: "قلم", en: "Pencil",
      g: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/>' },
    { id: "calculator", cat: "education", price: 100, ar: "حاسبة", en: "Calculator",
      g: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8.500 12h1M12 12h1M15.500 12h0M8.500 16h1M12 16h1M15.500 16h0" stroke-width="2.800"/>' },

    { id: "gear", cat: "tech", price: 120, ar: "هندسة", en: "Engineering",
      g: '<circle cx="12" cy="12" r="3"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100"/>' },
    { id: "code", cat: "tech", price: 120, ar: "برمجة", en: "Coding",
      g: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>' },
    { id: "laptop", cat: "tech", price: 120, ar: "حاسوب", en: "Computing",
      g: '<rect x="4.500" y="5" width="15" height="11" rx="1.500"/><path d="M2 20h20"/>' },
    { id: "bolt", cat: "tech", price: 120, ar: "كهرباء", en: "Electrical",
      g: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"' + F + '/>' },
    { id: "rocket", cat: "tech", price: 150, ar: "طموح", en: "Ambition",
      g: '<path d="M12 2c4 2 6 6 6 10l-3 3H9l-3-3c0-4 2-8 6-10z"/><circle cx="12" cy="9" r="1.600"/><path d="M9 15l-2 5 5-2M15 15l2 5-5-2"/>' },

    { id: "scales", cat: "law", price: 120, ar: "قانون", en: "Law",
      g: '<path d="M12 3v18M6 21h12M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>' },
    { id: "gavel", cat: "law", price: 120, ar: "قضاء", en: "Judiciary",
      g: '<path d="M13 3l8 8-3 3-8-8z"/><path d="M11.500 12.500L4 20M3 21h8"/>' },
    { id: "briefcase", cat: "law", price: 120, ar: "أعمال", en: "Business",
      g: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>' },

    { id: "palette", cat: "arts", price: 120, ar: "رسم", en: "Art",
      g: '<path d="M12 3a9 9 0 0 0 0 18c2 0 2-1.500 1-3s0-3 2-3h3a3 3 0 0 0 3-3 9 9 0 0 0-9-9z"/><circle cx="8" cy="10" r="1"' + F + '/><circle cx="12" cy="7" r="1"' + F + '/><circle cx="16" cy="10" r="1"' + F + '/>' },
    { id: "camera", cat: "arts", price: 120, ar: "تصوير", en: "Photography",
      g: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.500-3h5L16 7"/><circle cx="12" cy="13.500" r="3.500"/>' },
    { id: "music", cat: "arts", price: 120, ar: "موسيقى", en: "Music",
      g: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"' + F + '/><circle cx="17" cy="16" r="3"' + F + '/>' },

    { id: "paw", cat: "general", price: 150, ar: "عاشق القطط", en: "Cat lover",
      g: '<ellipse cx="12" cy="16" rx="5" ry="4"' + F + '/><circle cx="5.500" cy="11" r="2"' + F + '/><circle cx="9.500" cy="6.500" r="2"' + F + '/><circle cx="14.500" cy="6.500" r="2"' + F + '/><circle cx="18.500" cy="11" r="2"' + F + '/>' },
    { id: "star", cat: "general", price: 100, ar: "نجمة", en: "Star",
      g: '<path d="M12 3l2.700 5.500 6 .9-4.400 4.200 1 6L12 16.800 6.700 19.600l1-6L3.300 9.400l6-.9z"' + F + '/>' },
    { id: "moon", cat: "general", price: 100, ar: "سهر الليل", en: "Night owl",
      g: '<path d="M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z"' + F + '/>' },
    { id: "flame", cat: "general", price: 150, ar: "حماس", en: "On fire",
      g: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"' + F + '/>' },
    { id: "trophy", cat: "general", price: 300, ar: "كأس", en: "Trophy",
      g: '<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"/>' },

    /* ===== مهن مهمة بالعراق (تحتاج دراسة جامعية) ===== */
    { id: "hardhat", cat: "tech", price: 150, ar: "مهندس", en: "Engineer",
      g: '<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 7v5"/><path d="M8 17v-3M16 17v-3"/>' },
    { id: "oil", cat: "tech", price: 150, ar: "هندسة النفط", en: "Petroleum eng.",
      g: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/><path d="M9 15a3 3 0 0 0 3 3"/>' },
    { id: "crane", cat: "tech", price: 150, ar: "هندسة مدنية", en: "Civil eng.",
      g: '<path d="M5 21V4h3v17M8 7h12M17 7v5M3 21h8"/>' },
    { id: "compass", cat: "tech", price: 150, ar: "عمارة", en: "Architecture",
      g: '<path d="M12 3v3M12 6l-6 15M12 6l6 15M8 15h8"/>' },
    { id: "caduceus", cat: "medical", price: 150, ar: "طبيب", en: "Physician",
      g: '<path d="M12 3v18M8 6c4 0 4 4 0 4s-4 4 0 4M16 6c-4 0-4 4 0 4s4 4 0 4"/>' },
    { id: "labcoat", cat: "medical", price: 150, ar: "معطف الطبيب", en: "White coat",
      g: '<path d="M8 3l4 4 4-4 4 3-2 5v10H6V11L4 6z"/><path d="M12 7v14"/>' },
    { id: "scalpel", cat: "medical", price: 150, ar: "جراحة", en: "Surgery",
      g: '<path d="M20 4L9 15M9 15l-5 5 1-5z"/><path d="M14 10l3 3"/>' },
    { id: "xray", cat: "medical", price: 150, ar: "أشعة", en: "Radiology",
      g: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M12 8v8M9 16h6"/>' },
    { id: "wheat", cat: "jobs", price: 120, ar: "زراعة", en: "Agriculture",
      g: '<path d="M12 21V8M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zM12 8c3 0 4-2 4-4-3 0-4 2-4 4zM12 14c-3 0-4-2-4-4 3 0 4 2 4 4zM12 14c3 0 4-2 4-4-3 0-4 2-4 4z"/>' },
    { id: "board", cat: "jobs", price: 120, ar: "معلم", en: "Teacher",
      g: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4M7 9h6M7 12h4"/>' },
    { id: "plane", cat: "jobs", price: 120, ar: "طيران", en: "Aviation",
      g: '<path d="M22 3L2 11l7 3 3 7z"/><path d="M22 3L9 14"/>' },
    { id: "police", cat: "jobs", price: 120, ar: "ضابط", en: "Officer",
      g: '<path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z"/><path d="M12 8l1.200 2.500 2.800.4-2 2 .5 2.800L12 14.300 9.500 15.700l.5-2.800-2-2 2.800-.4z"/>' },
    { id: "news", cat: "jobs", price: 120, ar: "صحافة", en: "Journalism",
      g: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12h7M7 15h4"/>' },

    /* ===== شارات جديدة ===== */
    { id: "hospital", cat: "medical", price: 150, ar: "مستشفى", en: "Hospital",
      g: '<path d="M4 21V6l8-3 8 3v15z"/><path d="M12 9v6M9 12h6"/>' },
    { id: "thermometer", cat: "medical", price: 120, ar: "ميزان حرارة", en: "Thermometer",
      g: '<path d="M10 4a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 8v7"/>' },
    { id: "bandage", cat: "medical", price: 120, ar: "ضماد", en: "Bandage",
      g: '<rect x="2.500" y="8.500" width="19" height="7" rx="3.500" transform="rotate(-45 12 12)"/><path d="M10 10h.01M14 14h.01M14 10h.01M10 14h.01" stroke-width="2.800"/>' },
    { id: "magnet", cat: "science", price: 120, ar: "مغناطيس", en: "Magnet",
      g: '<path d="M5 3v8a7 7 0 0 0 14 0V3h-4v8a3 3 0 0 1-6 0V3z"/>' },
    { id: "globe", cat: "science", price: 120, ar: "جغرافيا", en: "Geography",
      g: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>' },
    { id: "leaf", cat: "science", price: 100, ar: "نبات", en: "Botany",
      g: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15z"/><path d="M5 19L14 10"/>' },
    { id: "bulb", cat: "education", price: 100, ar: "فكرة", en: "Idea",
      g: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.500c.7.8 1 1.500 1 2.500h6c0-1 .3-1.700 1-2.500A6 6 0 0 0 12 3z"/>' },
    { id: "clock", cat: "education", price: 100, ar: "وقت", en: "Time",
      g: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    { id: "target", cat: "education", price: 120, ar: "هدف", en: "Goal",
      g: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"' + F + '/>' },
    { id: "database", cat: "tech", price: 120, ar: "بيانات", en: "Data",
      g: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.700 3.600 3 8 3s8-1.300 8-3V6M4 12c0 1.700 3.600 3 8 3s8-1.300 8-3"/>' },
    { id: "shield", cat: "tech", price: 120, ar: "أمان", en: "Security",
      g: '<path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z"/>' },
    { id: "bank", cat: "law", price: 120, ar: "اقتصاد", en: "Economics",
      g: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>' },
    { id: "chart", cat: "law", price: 100, ar: "إحصاء", en: "Statistics",
      g: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>' },
    { id: "pen", cat: "arts", price: 100, ar: "خط", en: "Writing",
      g: '<path d="M12 20h9M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z"/>' },
    { id: "film", cat: "arts", price: 120, ar: "سينما", en: "Cinema",
      g: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>' },
    { id: "mic", cat: "arts", price: 120, ar: "صوت", en: "Voice",
      g: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>' },
    { id: "heart", cat: "general", price: 100, ar: "قلب طيب", en: "Kind heart",
      g: '<path d="M12 20s-8-5-8-11a4.500 4.500 0 0 1 8-2.500A4.500 4.500 0 0 1 20 9c0 6-8 11-8 11z"' + F + '/>' },
    { id: "sun", cat: "general", price: 100, ar: "شمس", en: "Early bird",
      g: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>' },
    { id: "coffee", cat: "general", price: 100, ar: "قهوة", en: "Coffee",
      g: '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2"/>' },
    { id: "diamond", cat: "general", price: 400, ar: "ألماس", en: "Diamond",
      g: '<path d="M6 4h12l4 5-10 12L2 9z"/><path d="M2 9h20"/>' },

    /* ===== شارات المواسم (تظهر بالمتجر فقط خلال موسمها، ومن اشتراها تبقى له) ===== */
    { id: "xmastree", cat: "season", season: "christmas", price: 100, ar: "شجرة الكريسماس", en: "Christmas tree",
      g: '<path d="M12 3l4.500 6H14l4 5.500H6L10 9H7.500z"/><path d="M12 14.500V20"/><circle cx="12" cy="3" r=".8"' + F + '/>' },

    /* ===== شارات رمضان (تظهر بالمتجر فقط خلال رمضان، ومن اشتراها تبقى له) ===== */
    { id: "ramadan_crescent", cat: "ramadan", season: "ramadan", price: 100, ar: "هلال رمضان", en: "Ramadan crescent",
      g: '<path d="M17 15.500A8 8 0 1 1 9 4a6.500 6.500 0 0 0 8 11.500z"/><path d="M18 5.500l.7 1.500 1.600.2-1.200 1.100.3 1.600-1.400-.8-1.400.8.3-1.600-1.200-1.100 1.600-.2z"' + F + '/>' },
    { id: "ramadan_lantern", cat: "ramadan", season: "ramadan", price: 100, ar: "فانوس", en: "Lantern",
      g: '<path d="M12 2v2M9.500 4h5l1 2h-7z"/><path d="M8.500 6h7l1.500 8-1.500 5h-8L7 14z"/><path d="M12 6v13M10 21h4"/>' },
    { id: "ramadan_cannon", cat: "ramadan", season: "ramadan", price: 100, ar: "مدفع الإفطار", en: "Iftar cannon",
      g: '<path d="M4 13l11-5 2.500 5-11 5z"/><circle cx="8" cy="17.500" r="3.200"/><path d="M19 8.500l2.500-1.500M20 11.500l2 .5M18.500 5l1-2"/>' },
    { id: "ramadan_dates", cat: "ramadan", season: "ramadan", price: 100, ar: "تمر", en: "Dates",
      g: '<ellipse cx="12" cy="14" rx="4.500" ry="7" transform="rotate(25 12 14)"/><path d="M13 6.500c.2-2 1.500-3 3.500-3.500"/><path d="M10 13c1 2 2.500 3 4 3.800"/>' },
    { id: "ramadan_vimto", cat: "ramadan", season: "ramadan", price: 100, ar: "فمتو", en: "Vimto",
      g: '<path d="M10 3h4M10.500 3v4L8.500 10v10a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V10l-2-3V3"/><path d="M8.500 13h7"/><circle cx="12" cy="17" r="1.500"' + F + '/>' },

    /* ===== شارات العيد (تظهر بالمتجر فقط خلال العيد، ومن اشتراها تبقى له) ===== */
    { id: "eid_sheep", cat: "eid", season: "eid", price: 100, ar: "خروف العيد", en: "Eid sheep",
      g: '<path d="M5 11a3 3 0 0 1 3-3 3.500 3.500 0 0 1 6 0 3 3 0 0 1 2 5H6a3 3 0 0 1-1-2z"/><path d="M16 10.500l3-.5 1.500 2.500-2 1.500"/><path d="M7.500 16v4M11 16v4M14.500 16v4"/><circle cx="18.500" cy="11.500" r=".7"' + F + '/>' }
  ];
  var MAP = {};
  LIST.forEach(function (b) { MAP[b.id] = b; });

  function lang() { try { return currentLanguage(); } catch (e) { return "ar"; } }
  function get(id) { return MAP[id] || null; }
  function name(id) { var b = MAP[id]; if (!b) return ""; return lang() === "ar" ? b.ar : b.en; }
  function catName(c) { var x = CAT[c]; return x ? (lang() === "ar" ? x.ar : x.en) : c; }

  /* يرجع عنصر <span> فيه SVG الشارة (الاسم من الكتالوج فقط) */
  function icon(id, px) {
    var b = MAP[id];
    if (!b) return null;
    px = px || 22;
    var gold = (id === "champion" || id === "developer");
    var bg = gold ? "url(#sjbGold)" : CAT[b.cat].bg;
    var defs = gold
      ? '<defs><linearGradient id="sjbGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e29a12"/></linearGradient></defs>'
      : "";
    var gstroke = gold ? "#7a4a00" : "#fff";
    var gfill = gold ? b.g.replace(/#fff/g, "#7a4a00") : b.g;
    var s = document.createElement("span");
    s.className = "bdg";
    s.title = name(id);
    s.style.width = s.style.height = px + "px";
    s.innerHTML = '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" aria-hidden="true">' + defs +
      '<circle cx="12" cy="12" r="11.500" fill="' + bg + '"/>' +
      '<circle cx="12" cy="12" r="11.500" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>' +
      '<g transform="translate(5.400 5.400) scale(.55)" fill="none" stroke="' + gstroke +
      '" stroke-width="2.300" stroke-linecap="round" stroke-linejoin="round">' + gfill + '</g></svg>';
    return s;
  }

  /* صف الشارات جنب الاسم: التاج لأبطال الأسبوع + أول شارتين مجهّزتين */
  /* ---- الشارات الخاصة (مثل المطوّر): تنجلب من السيرفر مرة وحدة وتظهر لكل الناس ---- */
  var SPECIAL = {}, specialOk = false;
  function isDev(uid) { return !!(uid && SPECIAL[uid] && SPECIAL[uid].indexOf("developer") >= 0); }
  function refreshViews() {
    try {
      if (typeof applyFlair === "function") applyFlair();
      ["podium", "rankList"].forEach(function (id) { var e = document.getElementById(id); if (e) e._sig = null; });
      if (typeof activeView !== "undefined" && activeView === "rank") {
        if (typeof loadPodium === "function") loadPodium();
        if (typeof loadRank === "function") loadRank(null, document.getElementById("rankList"));
      }
    } catch (e) {}
  }
  function loadSpecial() {
    try {
      if (typeof supabaseClient === "undefined" || !supabaseClient) return;
      supabaseClient.auth.getSession().then(function (r) {
        if (!r.data || !r.data.session) return null;
        return supabaseClient.rpc("get_special_badges");
      }).then(function (x) {
        if (!x || x.error || !x.data) return;
        var m = {};
        x.data.forEach(function (row) { (m[row.user_id] = m[row.user_id] || []).push(row.badge_id); });
        SPECIAL = m; specialOk = true;
        refreshViews();
      });
    } catch (e) {}
  }
  /* ستايل الاسم الأزرق المبرق للمطوّر */
  try {
    var st = document.createElement("style");
    st.textContent =
      "@keyframes sjDevGlow{0%,100%{color:#4aa8ff;text-shadow:0 0 4px #1e7bff,0 0 10px #1e7bff}50%{color:#bfe0ff;text-shadow:0 0 8px #4aa8ff,0 0 20px #1e90ff,0 0 32px #1e7bff}}" +
      ".sj-devname{animation:sjDevGlow 1.6s ease-in-out infinite;font-weight:800}";
    document.head.appendChild(st);
  } catch (e) {}
  setTimeout(loadSpecial, 2500);
  setInterval(function () { if (!specialOk) loadSpecial(); }, 15000);
  setInterval(loadSpecial, 10 * 60 * 1000);

  function chips(row, px) {
    var ids = [];
    if (row && row.user_id && SPECIAL[row.user_id]) SPECIAL[row.user_id].forEach(function (id) { if (MAP[id] && ids.indexOf(id) < 0) ids.push(id); });
    var isDev = ids.indexOf("developer") >= 0;
    if (row && row.is_gold && !isDev) ids.push("champion"); /* المطوّر ما ياخذ تاج بطل الأسبوع */
    ((row && row.badges) || []).forEach(function (id) {
      if (MAP[id] && id !== "champion" && !MAP[id].hidden && ids.indexOf(id) < 0 && ids.length < 3) ids.push(id);
    });
    if (!ids.length) return null;
    var wrap = document.createElement("span");
    wrap.className = "bdg-row";
    ids.forEach(function (id) { var i = icon(id, px || 20); if (i) wrap.appendChild(i); });
    if (isDev) {
      wrap.className += " sj-dev";
      /* الاسم (العنصر الي قبل الشارات، أو الأب إذا ما كو) يبرق بالأزرق */
      setTimeout(function () {
        try {
          var t = wrap.previousElementSibling || wrap.parentNode;
          if (t && t.classList) t.classList.add("sj-devname");
        } catch (e) {}
      }, 0);
    }
    return wrap;
  }

  return { isDev: isDev, LIST: LIST, CAT: CAT, get: get, name: name, catName: catName, icon: icon, chips: chips };
})();
