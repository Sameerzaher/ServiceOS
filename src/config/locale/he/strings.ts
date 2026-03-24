/**
 * App-wide UI copy (Hebrew). Domain terms (student, lesson, …) come from the active
 * `VerticalPreset.labels`; this file holds shell copy, validation, and templates.
 */

export const heUi = {
  errors: {
    pageTitle: "משהו השתבש",
    pageDescription:
      "אירעה שגיאה בלתי צפויה. אפשר לנסות שוב או לחזור לדף הבית.",
    tryAgain: "נסו שוב",
    goHome: "חזרה לדף הבית",
    globalTitle: "שגיאה קריטית",
    globalDescription:
      "לא ניתן להציג את הממשק. רעננו את הדף או נסו שוב מאוחר יותר.",
  },

  loading: {
    summary: "טוען סיכום…",
    students: "טוען תלמידים…",
    lessons: "טוען שיעורים…",
    default: "טוען…",
  },

  sections: {
    summary: "סיכום",
    reminders: "תזכורות",
    settings: "הגדרות",
    demo: "הדגמה וייצוא",
  },

  /** First-time flow until at least one lesson exists */
  onboarding: {
    step1Title: "שלב 1 מתוך 2 — תלמיד ראשון",
    step1Hint:
      "הוסיפו רשומת תלמיד בטופס למטה: שם מלא וטלפון. ההערות אופציונליות.",
    step2Title: "שלב 2 מתוך 2 — שיעור ראשון",
    step2Hint:
      "קבעו שיעור: בחרו תלמיד, תאריך ושעה. אחרי השמירה יופיעו הסיכומים והתזכורות.",
    jumpToForm: "מעבר לטופס",
  },

  toast: {
    clientCreated: "התלמיד נשמר בהצלחה",
    clientUpdated: "התלמיד עודכן",
    clientDeleted: "התלמיד נמחק",
    lessonCreated: "השיעור נשמר בהצלחה",
    lessonUpdated: "השיעור עודכן",
    lessonDeleted: "השיעור נמחק",
    paymentToggled: "סטטוס התשלום עודכן",
    reminderCopied: "ההודעה הועתקה ללוח",
    settingsSaved: "ההגדרות נשמרו",
    demoLoaded: "נתוני הדגמה נטענו",
    demoReset: "הנתונים אופסו",
    exportStudents: "קובץ תלמידים הורד",
    exportLessons: "קובץ שיעורים הורד",
    backupExported: "גיבוי הורד בהצלחה",
    backupRestored: "הנתונים שוחזרו מהגיבוי",
    storageSchemaReset:
      "נתונים מקומיים אופסו — גרסת האחסון לא נתמכת או פגומה. התחילו מחדש או שחזרו מגיבוי.",
    actionFailed: "הפעולה לא הושלמה. נסו שוב.",
  },

  /** Fallbacks when a preset omits optional label keys */
  defaults: {
    lessonSingular: "שיעור",
    lessonPlural: "שיעורים",
    studentSingular: "תלמיד",
    studentPlural: "תלמידים",
    records: "רשומות",
    appointments: "שיעורים",
  },

  dialog: {
    confirm: "אישור",
    cancel: "ביטול",
    backdropClose: "סגור",
    deleteClientTitle: "מחיקת לקוח",
    deleteClientMessage:
      "למחוק את הלקוח ואת כל השיעורים המשויכים אליו? פעולה זו לא ניתנת לביטול.",
    deleteAppointmentTitle: "מחיקת שיעור",
    deleteAppointmentMessage: "למחוק את השיעור? פעולה זו לא ניתנת לביטול.",
    resetDemoTitle: "איפוס כל הנתונים",
    resetDemoMessage:
      "כל התלמידים, השיעורים וההגדרות במכשיר זה יימחקו. פעולה זו אינה הפיכה. להמשיך?",
    loadDemoTitle: "טעינת נתוני הדגמה",
    loadDemoMessage:
      "טעינת הדגמה תחליף את הנתונים הקיימים במכשיר זה. מומלץ לייצא גיבוי לפני המשך. להמשיך?",
  },

  forms: {
    fullName: "שם מלא",
    phone: "טלפון",
    phonePrefix: "טלפון: ",
    notes: "הערות",
    save: "שמור",
    saveChanges: "שמור שינויים",
    cancelEdit: "בטל עריכה",
    saveLesson: "שמור שיעור",
    saving: "שומר…",
    editLesson: "ערוך שיעור",
    amount: "סכום (₪)",
    defaultAmountHint: (ils: number) => `ברירת מחדל מההגדרות: ${ils} ₪`,
    searchClients: "חיפוש לפי שם או טלפון…",
    selectPlaceholder: "בחר…",
    selectStudentPlaceholder: "בחר תלמיד…",
    appointmentStudent: "תלמיד",
    appointmentDatetime: "תאריך ושעה",
    appointmentDate: "תאריך",
    appointmentTime: "שעה",
    /** First option in the time dropdown */
    appointmentTimePlaceholder: "בחר שעה…",
    paymentStatus: "סטטוס תשלום",
    /** Shown when date, time, and default duration from settings are set */
    suggestedLessonEnd: (endTime: string) => `סיום משוער (לפי משך מההגדרות): ${endTime}`,
  },

  filters: {
    dateAll: "הכל",
    dateToday: "היום",
    dateTomorrow: "מחר",
    dateThisWeek: "השבוע",
    paymentAll: "כל התשלומים",
    paymentPaid: "שולם",
    paymentUnpaid: "לא שולם",
    sort: "מיון",
    sortByDate: "מיון: תאריך",
    sortByName: "מיון: שם",
    filterResultsEmpty: "אין תוצאות לפי הסינון הנוכחי.",
  },

  validation: {
    fullNameRequired: "נא להזין שם מלא (לפחות שני תווים).",
    studentRequired: "נא לבחור תלמיד מהרשימה.",
    datetimeInvalid: "נא לבחור תאריך ושעה תקינים.",
    phoneInvalid: "מספר הטלפון נראה קצר מדי — ודאו לפחות 9 ספרות.",
  },

  settings: {
    businessName: "שם העסק",
    businessNameHint: "יוצג בראש המסך, בתזכורות ובייצוא.",
    businessPhone: "טלפון העסק",
    businessPhoneHint:
      "מוצג בתבנית תזכורת עם {{businessPhone}} — ליצירת קשר מההודעה.",
    defaultLessonPrice: "מחיר ברירת מחדל לשיעור (₪)",
    defaultLessonPriceHint:
      "ממולא אוטומטית בשדה הסכום בטופס שיעור חדש (ניתן לשנות לפני שמירה).",
    defaultLessonDuration: "משך שיעור ברירת מחדל (דקות)",
    defaultLessonDurationHint:
      "מציג בטופס שיעור «סיום משוער» לפי שעת ההתחלה — לא נשמר ביומן.",
    reminderTemplate: "תבנית תזכורת (וואטסאפ)",
    reminderTemplateHint:
      "משתנים: {{name}}, {{time}}, {{business}} או {{businessName}}, {{businessPhone}}.",
    reminderPreviewTitle: "תצוגה מקדימה",
    previewStudentName: "יוסי כהן",
    previewLessonTime: "09:00",
    previewBusinessFallback: "בית ספר לנהיגה",
    previewPhoneFallback: "050-1234567",
    save: "שמור הגדרות",
    saving: "שומר…",
  },

  backup: {
    sectionTitle: "גיבוי ושחזור",
    description:
      "ייצוא או ייבוא מלא של כל הנתונים (תלמידים, שיעורים והגדרות) כקובץ JSON — נשמר אצלך במכשיר.",
    export: "ייצוא גיבוי (JSON)",
    import: "ייבוא גיבוי",
    importHint: "בחרו קובץ JSON שיוצא מהמערכת.",
    importConfirmTitle: "שחזור מהגיבוי",
    importConfirmMessage:
      "כל הנתונים הנוכחיים במכשיר זה יוחלפו בתוכן הקובץ. פעולה זו אינה הפיכה. להמשיך?",
    confirmRestore: "שחזור נתונים",
    errors: {
      notObject: "הקובץ אינו בפורמט תקין.",
      badVersion: "גרסת הגיבוי אינה נתמכת.",
      parseJson: "לא ניתן לקרוא את הקובץ — ודאו שזה JSON תקין.",
      invalidFileType: "יש לבחור קובץ JSON בלבד.",
      fileTooLarge: "קובץ הגיבוי גדול מדי לייבוא בדפדפן זה.",
    },
  },

  demo: {
    load: "טען נתוני הדגמה",
    reset: "איפוס נתונים",
    activeBadge: "מצב הדגמה פעיל — הנתונים במסך מיועדים להצגה בלבד.",
    returnToEmpty: "חזרה למצב ריק",
    emptyHint:
      "אין עדיין נתונים — טענו הדגמה מלאה לתלמידי נהיגה (מומלץ לדמו).",
    bannerTitle: "התחלת דמו מהירה",
    bannerDescription:
      "טעינת דוגמה עם תלמידים, שיעורים ותשלומים — מתאים להצגה לפני לקוחות.",
  },

  export: {
    students: "ייצוא תלמידים (CSV)",
    noStudentsToExport: "אין תלמידים לייצוא עדיין.",
    noLessonsToExport:
      "אין שיעורים לייצוא. הוסיפו שיעורים או שינו את טווח התאריכים והסינון.",
    lessonsTitle: "ייצוא שיעורים (CSV)",
    lessonsHint:
      "בחרו טווח תאריכים (אופציונלי) וסטטוס תשלום. שדה תאריך ריק = ללא גבול באותו צד.",
    dateFrom: "מתאריך",
    dateTo: "עד תאריך",
    paymentFilterLabel: "סטטוס תשלום",
    exportCsv: "הורד CSV",
    exporting: "מייצא…",
    invalidDateRange: "תאריך ההתחלה לא יכול להיות אחרי תאריך הסיום.",
  },

  empty: {
    clientsTitle: (studentsLabel: string) => `אין עדיין ${studentsLabel}`,
    clientsFallback: "אין עדיין רשומות",
    clientsDescription: "הוסיפו לקוח חדש כדי שיופיע כאן.",
    appointmentsTitle: (lessonsLabel: string) => `אין עדיין ${lessonsLabel}`,
    appointmentsFallback: "אין עדיין שיעורים",
    appointmentsDescription: "קבעו שיעור חדש כדי שיופיע כאן.",
    noStudentsForAppointmentTitle: "אין תלמידים זמינים",
    noStudentsForAppointmentDescription:
      "הוסיפו תלמיד לפני קביעת שיעור.",
  },

  boolean: {
    yes: "כן",
    no: "לא",
  },

  dashboard: {
    statTotal: (lessonsWord: string) => `סה״כ ${lessonsWord}`,
    statToday: "היום",
    statUnpaid: "לא שולמו",
    statTotalIncome: "הכנסות (שולמו)",
    statUnpaidAmount: "יתרה לגבייה",
    statTodayRevenue: "הכנסות היום",
    statStudentsWithDebt: "תלמידים עם חוב",
    statPartialAmount: "סכום בשיעורים חלקיים",
    summaryParagraph: (args: {
      total: number;
      lessonWord: string;
      lessonsWord: string;
      todayCount: number;
      unpaidCount: number;
      clientsCount: number;
      studentWord: string;
      studentsWord: string;
    }) => {
      const {
        total,
        lessonWord,
        lessonsWord,
        todayCount,
        unpaidCount,
        clientsCount,
        studentWord,
        studentsWord,
      } = args;
      const lessonNoun = total === 1 ? lessonWord : lessonsWord;
      const unpaidNoun =
        unpaidCount === 1 ? `${lessonWord} ללא תשלום` : `${lessonsWord} ללא תשלום`;
      let text =
        `סה״כ ${total} ${lessonNoun}, מתוכם ${todayCount} מתוכננים להיום, ו־ ${unpaidCount} ${unpaidNoun}.`;
      if (clientsCount > 0) {
        const people =
          clientsCount === 1 ? studentWord : studentsWord;
        text += ` נרשמו ${clientsCount} ${people}.`;
      }
      return text;
    },
    todaySectionTitle: (lessonsWord: string) => `${lessonsWord} להיום`,
    emptyTodayTitle: (lessonsWord: string) =>
      `אין ${lessonsWord} מתוכננים להיום`,
    emptyTodayDescription:
      "שיעורים שמוזמנים להיום יופיעו כאן.",
    statWeeklyRevenue: "הכנסות השבוע",
    debtListTitle: "תלמידים עם חוב — חמשת המובילים",
    upcomingListTitle: "שיעורים קרובים",
    emptyDebtList: "אין תלמידים עם חוב — הכל מסודר.",
    emptyUpcoming: "אין שיעורים מתוכננים קדימה.",
    unpaidBadge: "לא שולם",
  },

  appointments: {
    paymentPrefix: "תשלום: ",
    amountPrefix: "סכום: ",
    delete: "מחק",
    edit: "ערוך",
    markPaid: "סמן כשולם",
    markUnpaid: "סמן כלא שולם",
    tomorrowBadge: "מחר",
    tomorrowBadgeTitle: "שיעור מחר — מתאים לתזכורות",
    paidBadge: "שולם",
    unpaidBadge: "לא שולם",
  },

  reminders: {
    title: "תזכורות למחר",
    empty: "אין שיעורים מחר — אין מה לשלוח.",
    copyWhatsapp: "העתק הודעת וואטסאפ",
    copied: "הועתק",
    clipboardError:
      "לא ניתן להעתיק ללוח — בדקו הרשאות הדפדפן או נסו שוב.",
    templateHint:
      'תבנית: "היי {{name}}, תזכורת לשיעור מחר ב-{{time}}"',
  },

  clientCard: {
    nextLesson: "שיעור הבא",
    noUpcoming: "אין שיעור מתוכנן",
  },

  clientProfile: {
    back: "חזרה לדף הבית",
    notFound: "הלקוח לא נמצא",
    notFoundHint:
      "ייתכן שהקישור פג תוקף או שהרשומה נמחקה. חזרו לרשימה בדף הבית.",
    lessonsTotal: "סה״כ שיעורים",
    paidTotal: "שולם (סה״כ)",
    unpaidTotal: "לא שולם (סה״כ)",
    debtTitle: "יתרה לגבייה",
    paymentSummaryTitle: "סיכום תשלומים",
    detailsTitle: "פרטים",
    appointmentsTitle: "שיעורים",
    lastLesson: "שיעור אחרון",
    noLastLesson: "אין שיעור קודם",
    openWhatsapp: "וואטסאפ",
  },

  nav: {
    home: "בית",
    brand: "ServiceOS",
  },

  pwa: {
    installRegionLabel: "התקנת אפליקציה",
    installTitle: "התקנת ServiceOS",
    installChromeBody:
      "ניתן להוסיף את האפליקציה למסך הבית לגישה מהירה ולעבודה ללא דפדפן.",
    installIosBody:
      "לפתיחה מהמסך הראשי: לחצו על שיתוף ואז «הוסף למסך הבית».",
    installAction: "התקן",
    installDismiss: "לא עכשיו",
    offlineTitle: "אין חיבור לרשת",
    offlineBody:
      "לא ניתן לטעון את העמוד מהאינטרנט. אם ביקרתם כאן קודם, חלק מהממשק עלול להיות זמין במצב לא מקוון — הנתונים המקומיים במכשיר נשמרים.",
    offlineRetry: "נסו שוב",
    offlineHome: "דף הבית",
    offlineStatusOnline: "מקוון",
    offlineStatusOffline: "לא מקוון",
  },

  list: {
    profile: "פרופיל",
    edit: "ערוך",
    delete: "מחק",
    /** Quick action on client card — opens add-lesson form with client pre-selected */
    addLessonForClient: "שיעור לתלמיד זה",
  },
} as const;
