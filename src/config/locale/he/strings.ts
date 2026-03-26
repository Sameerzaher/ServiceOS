/**
 * App-wide UI copy (Hebrew). Domain terms (student, lesson, …) come from the active
 * `VerticalPreset.labels`; this file holds shell copy, validation, and templates.
 */

export const heUi = {
  errors: {
    pageTitle: "לא הצלחנו לטעון את העמוד",
    pageDescription:
      "קרתה תקלה זמנית. רעננו את הדף, או חזרו לדף הראשי והמשיכו משם.",
    tryAgain: "נסו שוב",
    goHome: "חזרה לדף הבית",
    globalTitle: "המערכת לא נטענת כרגע",
    globalDescription:
      "רעננו את הדף או סגרו את האפליקציה ופתחו שוב. אם זה חוזר — בדקו חיבור לאינטרנט.",
  },

  loading: {
    summary: "טוען תמונת מצב עדכנית...",
    students: "טוען את רשימת הלקוחות...",
    lessons: "טוען את היומן...",
    settings: "טוען את ההגדרות...",
    bookingSettings: "טוען את הגדרות ההזמנה...",
    default: "טוען נתונים...",
  },

  /** Load / sync failures for Supabase-backed data */
  data: {
    loadFailedTitle: "לא הצלחנו לטעון את הנתונים",
    loadFailedHint:
      "בדקו שהרשת זמינה. נסו שוב — אם זה נמשך, רעננו את הדף.",
    syncFailedTitle: "השמירה לענן לא הושלמה",
    syncFailedHint:
      "מה שרואים אצלכם במסך עדיין כאן. נסו שוב לשמור, או רעננו ונסו שוב.",
    settingsLoadFailedTitle: "לא הצלחנו לטעון הגדרות",
    availabilityLoadFailedTitle: "לא הצלחנו לטעון זמינות להזמנות",
  },

  sections: {
    summary: "סיכום ופעולות",
    reminders: "תזכורות",
    settings: "הגדרות",
    demo: "כלי התחלה וייצוא",
  },

  /** First-time flow until at least one lesson exists */
  onboarding: {
    welcomeTitle: "התחלה חכמה בדקה",
    welcomeHint:
      "שלושה צעדים קצרים ואתם באוויר: לקוח ראשון, שיעור ראשון, ותזכורת מוכנה לשליחה.",
    progressLabel: (done: number, total: number) => `התקדמות: ${done}/${total} הושלמו`,
    checklistAddClient: "הוספת לקוח או תלמיד ראשון",
    checklistAddLesson: "קביעת השיעור הראשון",
    checklistReviewReminders: "תזכורת אחת למחר",
    jumpToClientForm: "הוספת לקוח",
    jumpToLessonForm: "קביעת שיעור",
    markRemindersReviewed: "סימון כהושלם",
    dismiss: "סגירה לעכשיו",
  },

  toast: {
    clientCreated:
      "✅ הלקוח נוסף בהצלחה — אפשר לקבוע לו שיעור מהרשימה או מהפרופיל.",
    clientUpdated: "✅ הפרטים עודכנו והשינויים נשמרו.",
    clientDeleted: "הלקוח הוסר מהמערכת יחד עם השיעורים המשויכים אליו.",
    lessonCreated:
      "✅ השיעור נקבע בהצלחה — תמצאו אותו ברשימה, ביומן ובתזכורות למחר.",
    lessonUpdated: "✅ השיעור עודכן והפרטים נשמרו.",
    bookingApproved: "✅ הבקשה אושרה והשיעור עודכן ביומן.",
    bookingRejected: "הבקשה נדחתה והשיעור בוטל.",
    lessonDeleted: "השיעור הוסר מהיומן.",
    paymentToggled: "סטטוס התשלום עודכן.",
    reminderCopied: "ההודעה בלוח — פתחו וואטסאפ, הדביקו ושלחו.",
    bookingLinkCopied: "קישור ההזמנה הועתק — אפשר להדביק ולשלוח לתלמידים.",
    settingsSaved:
      "✅ ההגדרות נשמרו. השם, הטלפון ותבנית התזכורת יופיעו הלאה בהודעות.",
    demoLoaded: "נתוני הדגמה נטענו — אפשר לנווט בין המסכים ולהתרגל.",
    demoReset: "המערכת הוחזרה למצב ריק.",
    exportStudents: "הקובץ ירד — אפשר לפתוח בגיליון אלקטרוני.",
    exportLessons: "ייצוא השיעורים הושלם — הקובץ בדרך.",
    backupExported: "גיבוי מלא ירד למכשיר — שמרו אותו במקום בטוח.",
    backupRestored: "הנתונים שוחזרו מהגיבוי. בדקו שסיכום המספרים נראה תקין.",
    storageSchemaReset:
      "האחסון המקומי אופס בגלל תאימות גרסאות. אם יש לכם גיבוי — שחזרו ממנו. אחרת התחילו לבנות נתונים מחדש.",
    actionFailed: "לא הצלחנו להשלים את הפעולה. נסו שוב בעוד רגע.",
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
    confirm: "הבנתי",
    cancel: "ביטול",
    backdropClose: "סגור",
    confirmDeleteClient: "מחק לקוח",
    confirmDeleteAppointment: "מחק שיעור",
    confirmResetDemo: "איפוס מלא",
    deleteClientTitle: "למחוק את הלקוח?",
    deleteClientMessage:
      "יימחקו גם כל השיעורים של הלקוח מהמערכת. אי אפשר לבטל אחרי האישור.",
    deleteAppointmentTitle: "למחוק את השיעור?",
    deleteAppointmentMessage:
      "השיעור יוסר מהיומן. אם זה בטעות — אפשר לקבוע שיעור חדש מיד אחרי.",
    resetDemoTitle: "מחיקת כל הנתונים במכשיר",
    resetDemoMessage:
      "כל הלקוחות, השיעורים וההגדרות במכשיר זה יימחקו. לפני שממשיכים — מומלץ לייצא גיבוי. האם לאפס?",
    loadDemoTitle: "טעינת נתוני הדגמה",
    loadDemoMessage:
      "הנתונים הקיימים במכשיר יוחלפו בדוגמה מוכנה. רוצים להמשיך?",
  },

  forms: {
    fullName: "שם מלא",
    phone: "טלפון",
    phonePrefix: "טלפון: ",
    notes: "הערות",
    save: "שמירת פרטים",
    saveChanges: "שמירת שינויים",
    cancelEdit: "ביטול עריכה",
    saveLesson: "קביעת שיעור",
    saving: "שומר…",
    editLesson: "עריכת שיעור",
    amount: "סכום (₪)",
    defaultAmountHint: (ils: number) => `ברירת מחדל מההגדרות: ${ils} ₪`,
    searchClients: "חיפוש לפי שם או טלפון…",
    selectPlaceholder: "בחרו מהרשימה…",
    selectStudentPlaceholder: "בחרו לקוח…",
    appointmentStudent: "לקוח",
    appointmentDatetime: "תאריך ושעה",
    appointmentDate: "תאריך",
    appointmentTime: "שעה",
    /** First option in the time dropdown */
    appointmentTimePlaceholder: "בחרו שעה…",
    paymentStatus: "סטטוס תשלום",
    /** Shown when date, time, and default duration from settings are set */
    suggestedLessonEnd: (endTime: string) => `שעת סיום משוערת (לפי משך מההגדרות): ${endTime}`,
  },

  filters: {
    dateAll: "כל התאריכים",
    dateToday: "היום",
    dateTomorrow: "מחר",
    dateThisWeek: "השבוע",
    paymentAll: "כל סטטוסי התשלום",
    paymentPaid: "שולם",
    paymentUnpaid: "טרם שולם",
    sort: "מיון",
    sortByDate: "תאריך (מהמרוך לרחוק)",
    sortByName: "שם (א–ת)",
    filterResultsEmpty: "אין תוצאות בסינון הזה — נסו טווח אחר או איפוס מסנן.",
  },

  validation: {
    fullNameRequired: "נא למלא שם מלא (לפחות שני תווים).",
    studentRequired: "בחרו לקוח מהרשימה כדי לשייך את השיעור.",
    datetimeInvalid: "בחרו תאריך ושעה תקינים לשיעור.",
    phoneInvalid: "מספר הטלפון נראה קצר מדי — ודאו לפחות 9 ספרות.",
  },

  settings: {
    businessType: "סוג עסק",
    businessTypeHint:
      "המילים במסך (לקוח, שיעור, שדות נוספים) יתאימו לתחום שבחרתם — נהיגה, כושר, יופי ועוד.",
    activePresetDriving: "נהיגה — מורה פרטי / בית ספר",
    activePresetFitness: "כושר — מאמן / מכון",
    activePresetBeauty: "יופי וטיפוח",
    businessName: "שם העסק",
    businessNameHint: "מוצג בראש המסך, בדף ההזמנה הציבורי ובהודעות תזכורת.",
    teacherName: "שם המורה / בעל העסק",
    teacherNamePlaceholder: "למשל: דניאל לוי",
    businessPhone: "טלפון ליצירת קשר",
    businessPhoneHint:
      "ייכנס לתבנית התזכורת ({{businessPhone}}) כדי שלקוחות יהיה קל להשיב.",
    defaultLessonPrice: "מחיר ברירת מחדל לשיעור (₪)",
    defaultLessonPriceHint:
      "יתמלא בשיעור חדש — תמיד אפשר לשנות לפני השמירה.",
    defaultLessonDuration: "משך שיעור ברירת מחדל (דקות)",
    defaultLessonDurationHint:
      "מחשב «שעת סיום משוערת» בטופס השיעור בלבד; לא נשמר כחלק מהאירוע.",
    lessonBuffer: "מרווח בין שיעורים (דקות)",
    lessonBufferHint:
      "מרווח תפעולי מומלץ בין שיעור לשיעור לתכנון נוח יותר.",
    bookingEnabled: "פתיחת עמוד ההזמנה לתלמידים",
    workingHours: "שעות עבודה ברירת מחדל",
    workingHoursHint:
      "הגדרה מהירה לשעות פתיחה. תחול על חלון הזמינות השבועי במסך ההזמנות.",
    workingHoursStart: "שעת התחלה",
    workingHoursEnd: "שעת סיום",
    reminderTemplate: "תבנית תזכורת (וואטסאפ)",
    reminderTemplateHint:
      "משתנים: {{name}}, {{time}}, {{business}} או {{businessName}}, {{businessPhone}}.",
    reminderPreviewTitle: "איך זה ייראה",
    previewStudentName: "יוסי כהן",
    previewLessonTime: "09:00",
    previewBusinessFallback: "בית ספר לנהיגה",
    previewPhoneFallback: "050-1234567",
    save: "שמירת הגדרות",
    saving: "שומר…",
    sectionHint: "פרטי העסק והטקסטים שיוצגו ללקוחות בהודעות ובדף ההזמנה.",
    bookingTitle: "הזמנה אונליין",
    bookingHint:
      "דף ציבורי שבו לקוחות בוחרים מועד פנוי ומשאירים פרטים — אתם מאשרים ומנהלים מהמערכת.",
    bookingPublicLink: "פתיחת דף ההזמנה (לשיתוף עם לקוחות)",
    bookingPublicUrlLabel: "קישור ציבורי לשיתוף",
    bookingCopyLink: "העתקת קישור",
    bookingShareWhatsapp: "שיתוף בוואטסאפ",
    bookingShareText: (url: string) =>
      `היי, אפשר לקבוע מועד דרך הקישור הזה:\n${url}`,
  },

  backup: {
    sectionTitle: "גיבוי ושחזור",
    description:
      "ייצוא או ייבוא מלא: לקוחות, שיעורים והגדרות בקובץ JSON אחד, נשמר אצלכם במכשיר.",
    export: "ייצוא גיבוי (JSON)",
    import: "ייבוא מגיבוי",
    importHint: "בחרו קובץ JSON שיוצא מהמערכת הזו.",
    actionsHint:
      "לפני ייבוא מומלץ לייצא גיבוי של המצב הנוכחי — כך תמיד אפשר לחזור אחורה.",
    importConfirmTitle: "שחזור מהגיבוי",
    importConfirmMessage:
      "כל הנתונים במכשיר יוחלפו בתוכן הקובץ. לא ניתן לבטל לאחר האישור. להמשיך?",
    confirmRestore: "שחזור עכשיו",
    errors: {
      notObject: "הקובץ לא בפורמט שהמערכת מזהה.",
      badVersion: "גרסת הגיבוי לא נתמכת בגרסה הנוכחית.",
      parseJson: "לא הצלחנו לקרוא את הקובץ — ודאו שזה קובץ JSON תקין.",
      invalidFileType: "יש לבחור קובץ בסיומת .json בלבד.",
      fileTooLarge: "הקובץ גדול מדי לטעינה בדפדפן — נסו במחשב או קיצרו את הגיבוי.",
    },
  },

  demo: {
    load: "התחלה עם נתוני דוגמה",
    reset: "איפוס כל הנתונים",
    activeBadge: "מצב הדגמה פעיל",
    activeDescription:
      "אתם רואים נתונים לדוגמה. אפשר לאפס ולחזור לעבודה על עסק אמיתי בכל רגע.",
    reloadDemo: "טעינה מחדש של הדגמה",
    returnToEmpty: "מחיקת הדגמה ומעבר לריק",
    emptyHint:
      "עדיין אין נתונים — טענו דוגמה כדי לראות איך המסכים נראים עם לקוחות ושיעורים.",
    bannerTitle: "הכל מוכן להתחלה",
    bannerDescription:
      "דוגמה מלאה: לקוחות, שיעורים קרובים, תשלומים ותזכורת למחר — טובה להתרשמות או הדרכה.",
  },

  export: {
    students: "ייצוא רשימת לקוחות (CSV)",
    noStudentsToExport: "אין עדיין לקוחות לייצוא — הוסיפו לקוח ונסו שוב.",
    noLessonsToExport:
      "אין שיעורים בטווח שבחרתם. נסו תאריכים רחבים יותר או בטלו סינון.",
    lessonsTitle: "ייצוא שיעורים (CSV)",
    lessonsHint:
      "סננו לפי תאריכים (ריק = בלי גבול) ולפי סטטוס תשלום, ואז הורידו את הקובץ.",
    dateFrom: "מתאריך",
    dateTo: "עד תאריך",
    paymentFilterLabel: "סטטוס תשלום",
    exportCsv: "הורדת קובץ",
    exporting: "מייצא…",
    invalidDateRange: "תאריך ההתחלה חייב להיות לפני או זהה לתאריך הסיום — בדקו את הבחירה.",
  },

  empty: {
    clientsTitle: (studentsLabel: string) =>
      `עדיין אין ${studentsLabel} — בואו נוסיף את הראשון`,
    clientsFallback: "אין נתונים עדיין",
    clientsDescription:
      "לקוח ראשון ברשימה = תזכורות, יומן ועקיבה אחרי תשלומים. לחצו על «הוספת לקוח» למעלה.",
    appointmentsTitle: (lessonsLabel: string) =>
      `עדיין אין ${lessonsLabel} — הגיע הזמן לקבוע`,
    appointmentsFallback: "אין נתונים עדיין",
    appointmentsDescription:
      "קבעו שיעור ללקוח קיים או הוסיפו לקוח חדש — וכל האירועים יופיעו כאן.",
    noStudentsForAppointmentTitle: "קודם צריך לקוח ברשימה",
    noStudentsForAppointmentDescription:
      "הוסיפו לקוח אחד לפחות, ואז חזרו לכאן כדי לקבוע שיעור.",
  },

  boolean: {
    yes: "כן",
    no: "לא",
  },

  dashboard: {
    quickActionsTitle: "פעולה מהירה להתחלה",
    quickAddClient: "הוספת לקוח",
    quickAddAppointment: "קביעת שיעור",
    remindersSectionTitle: "תזכורות למחר",
    todaySectionHint:
      "רשימת השיעורים להיום לפי שעה — מבט מהיר על מה שמחכה עכשיו.",
    remindersSectionHint:
      "העתיקו טקסט מוכן לוואטסאפ, או נסחו מחדש עם AI — ושלחו ללקוח בלחיצה.",
    kpiToday: "שיעורים היום",
    kpiTomorrow: "שיעורים מחר",
    kpiUnpaid: "ממתינים לתשלום",
    kpiClients: "סה״כ לקוחות",
    kpiAppointmentsTotal: "סה״כ שיעורים",
    kpiPendingBookings: "בקשות הזמנה ממתינות",
    homeEmptyStartTitle: "עוד אין נתונים להתחלה",
    homeEmptyStartDescription: "הוסיפו לקוח ראשון כדי להתחיל",
    homeEmptySummaryTitle: "עוד אין נתונים להתחלה",
    homeEmptySummaryDescription:
      "אחרי בקשת הזמנה ראשונה תראו כאן תמונת מצב",
    statTotal: (lessonsWord: string) => `סה״כ ${lessonsWord}`,
    statToday: "היום",
    statUnpaid: "טרם שולם",
    statTotalIncome: "הכנסות (שולמו)",
    statUnpaidAmount: "יתרה לגבייה",
    statTodayRevenue: "הכנסות היום",
    statStudentsWithDebt: "עם יתרה לגבייה",
    statPartialAmount: "סכום בתשלומים חלקיים",
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
        `סה״כ ${total} ${lessonNoun}: ${todayCount} מתוכננים להיום, ו־${unpaidCount} ${unpaidNoun}.`;
      if (clientsCount > 0) {
        const people = clientsCount === 1 ? studentWord : studentsWord;
        text += ` ברשימה ${clientsCount} ${people}.`;
      }
      return text;
    },
    todaySectionTitle: (lessonsWord: string) => `${lessonsWord} להיום`,
    emptyTodayTitle: (lessonsWord: string) =>
      `אין ${lessonsWord} מתוכננים להיום`,
    emptyTodayDescription:
      "היום ריק ביומן — אפשר לקבוע שיעור מהיר מהכפתור למעלה.",
    statWeeklyRevenue: "הכנסות השבוע",
    debtListTitle: "חמשת הלקוחות המובילים ביתרה",
    upcomingListTitle: "שיעורים קרובים",
    emptyDebtList: "אין יתרות לגבייה — הכול שולם.",
    emptyUpcoming: "אין שיעורים מתוכננים קדימה — הגיע הזמן לסגור תורים.",
    unpaidBadge: "טרם שולם",
    bookingRequestsTitle: "בקשות הזמנה",
    bookingRequestsLoading: "טוענים בקשות הזמנה…",
    bookingRequestsEmpty: "אין בקשות הזמנה כרגע — הכל מוכן להתחלה.",
    bookingRequesterName: "שם",
    bookingRequesterPhone: "טלפון",
    bookingRequesterDateTime: "מועד",
    bookingRequesterStatus: "סטטוס",
    bookingStatusPending: "ממתין",
    bookingStatusConfirmed: "אושר",
    bookingStatusCancelled: "בוטל",
    bookingActionConfirm: "אשר",
    bookingActionCancel: "בטל",
  },

  appointments: {
    paymentPrefix: "תשלום: ",
    amountPrefix: "סכום: ",
    phonePrefix: "טלפון: ",
    statusPrefix: "סטטוס: ",
    statusScheduled: "נקבע",
    statusConfirmed: "מאושר",
    statusInProgress: "בתהליך",
    statusCompleted: "הושלם",
    statusCancelled: "בוטל",
    statusNoShow: "לא הגיע",
    delete: "מחיקה",
    edit: "עריכה",
    markPaid: "סמן כשולם",
    markUnpaid: "סמן כטרם שולם",
    tomorrowBadge: "מחר",
    tomorrowBadgeTitle: "שיעור מחר — מתאים לתזכורת",
    paidBadge: "שולם",
    unpaidBadge: "טרם שולם",
    pendingApprovalBadge: "ממתין לאישור",
    approvedRequestBadge: "אושר",
    rejectedRequestBadge: "נדחה",
    approveRequest: "אשר בקשה",
    approveAndSendWhatsapp: "אשר ושלח וואטסאפ",
    rejectRequest: "דחה בקשה",
    approvalWhatsappText: (args: { name: string; dateTime: string }) =>
      `היי ${args.name}, בקשתך אושרה ✅\nנשמח לראות אותך ב-${args.dateTime}.`,
  },

  reminders: {
    title: "תזכורות למחר",
    empty: "מחר אין שיעורים ביומן",
    emptyHint:
      "כשנקבע שיעור למחר, תופיע כאן הודעה מוכנה — או תוכלו לנסח אוטומטית.",
    copyWhatsapp: "העתקת הודעה לוואטסאפ",
    copied: "הועתק",
    clipboardError:
      "לא הצלחנו להעתיק — ודאו הרשאות לדפדפן או העתיקו ידנית מהתיבה.",
    templateHint:
      'תבנית לדוגמה: "היי {{name}}, תזכורת לשיעור מחר ב־{{time}}"',
    aiGenerate: "ניסוח עם AI",
    aiGenerating: "מנסחים…",
    aiCopy: "העתקה",
  },

  clientsPage: {
    /** כפתור לכיווץ טופס הוספת לקוח כשאין עריכה פעילה */
    closeAddPanel: "סגור",
    addClientTeaser: "בלחיצה נפתח טופס — הפרטים יישמרו ברשימת הלקוחות למטה.",
  },

  clientCard: {
    nextLesson: "הפגישה הבאה",
    noUpcoming: "אין תור מתוכנן",
  },

  clientProfile: {
    back: "חזרה לדף הבית",
    notFound: "לא מצאנו את הלקוח",
    notFoundHint:
      "אולי הרשומה נמחקה או שהקישור לא מעודכן. חזרו לרשימה בדף הבית.",
    lessonsTotal: "סה״כ שיעורים",
    paidTotal: "שולם (סה״כ)",
    unpaidTotal: "טרם שולם (סה״כ)",
    debtTitle: "יתרה לגבייה",
    paymentSummaryTitle: "סיכום תשלומים",
    detailsTitle: "פרטים",
    appointmentsTitle: "שיעורים",
    appointmentsEmptyTitle: "עדיין אין שיעורים ללקוח הזה",
    appointmentsEmptyHint:
      "חזרו לדף הבית או למסך השיעורים כדי לקבוע את הפגישה הראשונה.",
    lastLesson: "שיעור אחרון",
    noLastLesson: "אין שיעור קודם ברשומה",
    openWhatsapp: "שליחה בוואטסאפ",
  },

  nav: {
    home: "בית",
    back: "חזרה",
    brand: "ServiceOS",
    dashboard: "ראשי",
    clients: "לקוחות",
    lessons: "שיעורים",
    booking: "הזמנה",
    settings: "הגדרות",
  },

  pwa: {
    installRegionLabel: "התקנה על המסך",
    installTitle: "הוספת ServiceOS למסך הבית",
    installChromeBody:
      "תקבלו אייקון מהיר, ופתיחה נוחה יותר כמו באפליקציה.",
    installIosBody:
      "ב־Safari: לחצו על שיתוף ובחרו «הוסף למסך הבית».",
    installAction: "הוספה",
    installDismiss: "לא עכשיו",
    offlineTitle: "אין חיבור לאינטרנט",
    offlineBody:
      "לא ניתן לטעון את העמוד מהרשת. נתונים שכבר נטענו במכשיר עשויים להישאר זמינים לזמן מה.",
    offlineRetry: "נסו שוב",
    offlineHome: "דף הבית",
    offlineStatusOnline: "מחוברים",
    offlineStatusOffline: "לא מקוונים",
  },

  list: {
    profile: "כרטיס לקוח",
    edit: "עריכה",
    delete: "מחיקה",
    /** Quick action on client card — opens add-lesson form with client pre-selected */
    addLessonForClient: "קביעת שיעור",
  },

  /** דף ההזמנה הציבורי (/book) והטפסים שלו */
  publicBooking: {
    pageTitle: "קביעת שיעור נהיגה",
    pageSubtitle:
      "בוחרים תאריך ושעה פנויה, משאירים פרטים — ואנחנו מאשרים ומעדכנים אתכם.",
    trustLine:
      "המועד נשמר כבקשה. ניצור קשר לאישור סופי או שינוי — אין חיוב מהדף הזה.",
    sectionDate: "בחירת מועד",
    sectionContact: "פרטים לאישור ויצירת קשר",
    dateLabel: "תאריך",
    bookingClosed:
      "ההזמנה המקוונת סגורה כרגע. אפשר לנסות שוב מאוחר יותר או לפנות ישירות לעסק.",
    slotHeading: "שעות פנויות",
    slotEmptyTitle: "אין בשעה הזו שעות פנויות",
    slotEmptyDescription: "נסו תאריך אחר באותו השבוע, או חזרו מחר לבדיקה.",
    selectedSlotLabel: "שעה שנבחרה",
    noSlotSelected: "עדיין לא נבחרה שעה",
    successTitle: "✅ הבקשה התקבלה",
    successDescription:
      "תודה ששיתפתם פרטים. נאשר את השיעור בקרוב — שימרו את הטלפון זמין להודעה או שיחה.",
    inlineSuccess: "הבקשה נרשמה במערכת. נעדכן אתכם לאישור.",
    fullNameLabel: "שם מלא",
    phoneLabel: "טלפון",
    notesLabel: "הערות (רשות)",
    pickupLabel: "מיקום איסוף (רשות)",
    carLabel: "סוג רכב / גיר (רשות)",
    pickupPlaceholder: "למשל: כתובת או שכונה",
    carPlaceholder: "למשל: אוטומט, ידני",
    submitSubmitting: "שולחים את הבקשה…",
    submitIdle: "שליחת בקשה לקביעת שיעור",
    errFullName: "נא למלא שם מלא.",
    errPhone: "נא למלא מספר טלפון לחזרה.",
    errSlot: "בחרו שעה מהרשימה לפני השליחה.",
    errInvalidPayload: "משהו בשליחה לא הסתדר. רעננו את הדף ונסו שוב.",
    errSlotInvalid: "המועד שנבחר לא תקין. בחרו שעה מחדש מהרשימה.",
    errSlotRange: "השעות שנבחרו לא מתאימות. בחרו מועד מהאפשרויות באתר.",
    errSlotPast: "השעה כבר עברה. בחרו מועד עתידי מהרשימה.",
    errUnavailable: "ההזמנה דרך האתר אינה זמינה כרגע. פנו לעסק ישירות או נסו שוב מאוחר יותר.",
    errSaveFailed: "לא הצלחנו לרשום את הבקשה. נסו שוב או בחרו מועד אחר.",
    errNetwork: "נתקענו בחיבור לרשת. בדקו אינטרנט ונסו שוב.",
    errSlotTaken:
      "השעה נתפסה רגע לפני כן על ידי מישהו אחר. בחרו מועד פנוי אחר.",
    errDateNotInRange:
      "לא ניתן להזמין את התאריך הזה לפי מדיניות ההזמנות של העסק. בחרו תאריך אחר.",
    errServerGeneric:
      "לא הצלחנו להשלים את הרישום. נסו שוב בעוד רגע או פנו לעסק.",
  },
} as const;
