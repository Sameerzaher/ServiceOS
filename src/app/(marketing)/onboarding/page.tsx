"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_BRANDING } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ui } from "@/components/ui/theme";
import type { BusinessType } from "@/core/types/teacher";

const STEPS = [
  { id: "welcome", title: "ברוכים הבאים" },
  { id: "business", title: "פרטי העסק" },
  { id: "availability", title: "זמינות" },
  { id: "done", title: "סיום" },
] as const;

type StepId = typeof STEPS[number]["id"];

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState<StepId>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    businessType: "driving_instructor" as BusinessType,
    businessName: "",
    fullName: "",
    phone: "",
    workDays: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
    workHours: { start: "09:00", end: "17:00" },
    lessonDuration: 60,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  function nextStep() {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  }

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      // Create teacher via API
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          fullName: formData.fullName,
          phone: formData.phone,
          slug: formData.businessName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-"),
          businessType: formData.businessType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast(data.error || "שגיאה ביצירת העסק", "error");
        return;
      }

      // Save availability settings
      // TODO: Call availability settings API

      toast("העסק נוצר בהצלחה! 🎉");
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (e) {
      console.error("[Onboarding] error:", e);
      toast("אירעה שגיאה. נסו שוב.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-sm text-neutral-600">
              {STEPS.map((step, idx) => (
                <span
                  key={step.id}
                  className={
                    idx <= currentStepIndex
                      ? "font-semibold text-emerald-600"
                      : ""
                  }
                >
                  {step.title}
                </span>
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Card */}
          <div className={ui.card + " p-8"}>
            {/* Step: Welcome */}
            {currentStep === "welcome" && (
              <div className="text-center">
                <div className="mb-6 text-6xl">{PRODUCT_BRANDING.icon}</div>
                <h1 className="mb-4 text-3xl font-bold text-neutral-900">
                  ברוכים הבאים ל-{PRODUCT_BRANDING.name}!
                </h1>
                <p className="mb-8 text-lg text-neutral-600">
                  בואו נגדיר את העסק שלכם תוך 2 דקות
                </p>
                <Button variant="primary" onClick={nextStep} className="px-8">
                  בואו נתחיל 🚀
                </Button>
              </div>
            )}

            {/* Step: Business Details */}
            {currentStep === "business" && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-neutral-900">
                  ספרו לנו על העסק שלכם
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className={ui.label}>סוג העסק</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PRODUCT_BRANDING.audiences.slice(0, 4).map((aud) => (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() =>
                            setFormData((d) => ({
                              ...d,
                              businessType: aud.id as BusinessType,
                            }))
                          }
                          className={`rounded-lg border-2 p-4 text-center transition-all ${
                            formData.businessType === aud.id
                              ? "border-emerald-600 bg-emerald-50"
                              : "border-neutral-200 hover:border-emerald-300"
                          }`}
                        >
                          <div className="mb-2 text-3xl">{aud.icon}</div>
                          <div className="text-sm font-medium">{aud.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={ui.label} htmlFor="businessName">
                      שם העסק *
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          businessName: e.target.value,
                        }))
                      }
                      className={ui.input}
                      placeholder="בית ספר לנהיגה דוגמא"
                    />
                  </div>

                  <div>
                    <label className={ui.label} htmlFor="fullName">
                      השם שלך *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, fullName: e.target.value }))
                      }
                      className={ui.input}
                      placeholder="ישראל ישראלי"
                    />
                  </div>

                  <div>
                    <label className={ui.label} htmlFor="phone">
                      מספר טלפון *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, phone: e.target.value }))
                      }
                      className={ui.input}
                      placeholder="050-0000000"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button variant="secondary" onClick={prevStep} className="flex-1">
                    חזרה
                  </Button>
                  <Button
                    variant="primary"
                    onClick={nextStep}
                    disabled={
                      !formData.businessName ||
                      !formData.fullName ||
                      !formData.phone
                    }
                    className="flex-1"
                  >
                    המשך
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Availability */}
            {currentStep === "availability" && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-neutral-900">
                  מתי אתם זמינים?
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className={ui.label}>ימי עבודה</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "sunday", label: "א׳" },
                        { id: "monday", label: "ב׳" },
                        { id: "tuesday", label: "ג׳" },
                        { id: "wednesday", label: "ד׳" },
                        { id: "thursday", label: "ה׳" },
                        { id: "friday", label: "ו׳" },
                      ].map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            const has = formData.workDays.includes(day.id);
                            setFormData((d) => ({
                              ...d,
                              workDays: has
                                ? d.workDays.filter((id) => id !== day.id)
                                : [...d.workDays, day.id],
                            }));
                          }}
                          className={`rounded-lg border-2 p-3 font-medium transition-all ${
                            formData.workDays.includes(day.id)
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-neutral-200 text-neutral-600 hover:border-emerald-300"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={ui.label} htmlFor="startTime">
                        שעת התחלה
                      </label>
                      <input
                        id="startTime"
                        type="time"
                        value={formData.workHours.start}
                        onChange={(e) =>
                          setFormData((d) => ({
                            ...d,
                            workHours: { ...d.workHours, start: e.target.value },
                          }))
                        }
                        className={ui.input}
                      />
                    </div>
                    <div>
                      <label className={ui.label} htmlFor="endTime">
                        שעת סיום
                      </label>
                      <input
                        id="endTime"
                        type="time"
                        value={formData.workHours.end}
                        onChange={(e) =>
                          setFormData((d) => ({
                            ...d,
                            workHours: { ...d.workHours, end: e.target.value },
                          }))
                        }
                        className={ui.input}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={ui.label} htmlFor="duration">
                      משך מפגש (דקות)
                    </label>
                    <select
                      id="duration"
                      value={formData.lessonDuration}
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          lessonDuration: Number(e.target.value),
                        }))
                      }
                      className={ui.select}
                    >
                      <option value={30}>30 דקות</option>
                      <option value={45}>45 דקות</option>
                      <option value={60}>60 דקות</option>
                      <option value={90}>90 דקות</option>
                      <option value={120}>120 דקות</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button variant="secondary" onClick={prevStep} className="flex-1">
                    חזרה
                  </Button>
                  <Button variant="primary" onClick={nextStep} className="flex-1">
                    המשך
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Done */}
            {currentStep === "done" && (
              <div className="text-center">
                <div className="mb-6 text-6xl">🎉</div>
                <h2 className="mb-4 text-3xl font-bold text-neutral-900">
                  מוכנים לעבודה!
                </h2>
                <p className="mb-8 text-lg text-neutral-600">
                  הכל מוכן. בואו ניצור את העסק שלכם וניכנס לדאשבורד
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="primary"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "יוצר..." : "צור עסק וכנס 🚀"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    חזרה
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
