import { useEffect, useMemo, useState } from "react";
import type { Plan, UserProfile } from "@/utils/pdf";
import { samplePlans } from "@/data/samplePlans";
import PlanDisplay from "./PlanDisplay";

function choosePlan(profile: UserProfile): Plan {
  const hasDiabetesHistory = profile.familyHistory.includes("diabetes");

  if (profile.age < 30 && !profile.smoker && !hasDiabetesHistory) {
    return samplePlans.youngAdult;
  }

  if (
    profile.age >= 40 && profile.age < 60 && (profile.smoker || hasDiabetesHistory)
  ) {
    return samplePlans.middleAgeSmoker;
  }

  if (profile.age >= 60 || profile.sedentary) {
    return samplePlans.seniorSedentary;
  }

  return samplePlans.youngAdult;
}

type Step =
  | "age"
  | "gender"
  | "smoker"
  | "sedentary"
  | "alcohol"
  | "familyHistory"
  | "lab"
  | "done";

const FAMILY_KEYS = ["diabetes", "heart disease", "cancer", "hypertension"] as const;

type Draft = {
  age?: number;
  gender?: UserProfile["gender"];
  smoker?: boolean;
  sedentary?: boolean;
  alcohol?: UserProfile["alcohol"];
  familyHistory: string[];
};

export default function Chat({ embedded = false, className = "" }: { embedded?: boolean; className?: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [labName, setLabName] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("age");
  const [draft, setDraft] = useState<Draft>({ familyHistory: [] });
  const [ageInput, setAgeInput] = useState<string>("");

  useEffect(() => {
    // Initial greeting
    if (!profile && step === "age" && !ageInput) {
      // no-op UI wise; greeting is rendered below
    }
  }, [profile, step, ageInput]);

  const plan = useMemo(() => (profile ? choosePlan(profile) : null), [profile]);

  const next = () => {
    if (step === "age") return setStep("gender");
    if (step === "gender") return setStep("smoker");
    if (step === "smoker") return setStep("sedentary");
    if (step === "sedentary") return setStep("alcohol");
    if (step === "alcohol") return setStep("familyHistory");
    if (step === "familyHistory") return setStep("lab");
    if (step === "lab") return finalize();
  };

  const finalize = () => {
    if (
      draft.age == null ||
      draft.gender == null ||
      draft.smoker == null ||
      draft.sedentary == null ||
      draft.alcohol == null
    ) {
      return;
    }
    const full: UserProfile = {
      age: draft.age,
      gender: draft.gender,
      smoker: draft.smoker,
      sedentary: draft.sedentary,
      alcohol: draft.alcohol,
      familyHistory: draft.familyHistory,
    } as UserProfile;
    setProfile(full);
    setStep("done");
  };

  const toggleHistory = (key: string) => {
    setDraft((d) => ({
      ...d,
      familyHistory: d.familyHistory.includes(key)
        ? d.familyHistory.filter((k) => k !== key)
        : [...d.familyHistory, key],
    }));
  };

  return (
    <div className={embedded ? className : "mx-auto max-w-3xl space-y-6 p-4"}>
      <div className={embedded ? "rounded-xl border bg-card p-3" : "rounded-xl border bg-card p-4"}>
        <div className={embedded ? "mb-3 flex items-center gap-2" : "mb-4 flex items-center gap-2"}>
          <div className="h-9 w-9 rounded-full bg-primary/10" />
          <div>
            <h1 className="text-lg font-semibold">Preventive Care Planner</h1>
            <p className="text-xs text-muted-foreground">
              Friendly guidance to build your vaccines, screenings, and lifestyle plan.
            </p>
          </div>
        </div>

        {!profile && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">Hi there! 👋</div>
              <div>This quick chat will ask one question at a time to personalize your plan. Your data stays in your browser.</div>
            </div>

            {step === "age" && (
              <div className="space-y-2">
                <div className="text-sm">First, how old are you?</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    className="w-32 rounded-md border px-3 py-2"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                  />
                  <button
                    className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
                    onClick={() => {
                      const n = parseInt(ageInput, 10);
                      if (!isNaN(n) && n >= 0) {
                        setDraft((d) => ({ ...d, age: n }));
                        next();
                      }
                    }}
                    disabled={!ageInput}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === "gender" && (
              <div className="space-y-2">
                <div className="text-sm">What is your gender?</div>
                <div className="flex flex-wrap gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => {
                        setDraft((d) => ({ ...d, gender: g }));
                        next();
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "smoker" && (
              <div className="space-y-2">
                <div className="text-sm">Do you smoke?</div>
                <div className="flex gap-2">
                  <button className="rounded-md border px-3 py-2 text-sm hover:bg-muted" onClick={() => { setDraft((d)=>({...d, smoker: true})); next(); }}>Yes</button>
                  <button className="rounded-md border px-3 py-2 text-sm hover:bg-muted" onClick={() => { setDraft((d)=>({...d, smoker: false})); next(); }}>No</button>
                </div>
              </div>
            )}

            {step === "sedentary" && (
              <div className="space-y-2">
                <div className="text-sm">Would you describe your lifestyle as sedentary?</div>
                <div className="flex gap-2">
                  <button className="rounded-md border px-3 py-2 text-sm hover:bg-muted" onClick={() => { setDraft((d)=>({...d, sedentary: true})); next(); }}>Yes</button>
                  <button className="rounded-md border px-3 py-2 text-sm hover:bg-muted" onClick={() => { setDraft((d)=>({...d, sedentary: false})); next(); }}>No</button>
                </div>
              </div>
            )}

            {step === "alcohol" && (
              <div className="space-y-2">
                <div className="text-sm">How would you describe your alcohol intake?</div>
                <div className="flex flex-wrap gap-2">
                  {(["none", "moderate", "high"] as const).map((a) => (
                    <button
                      key={a}
                      className="rounded-md border px-3 py-2 text-sm capitalize hover:bg-muted"
                      onClick={() => {
                        setDraft((d) => ({ ...d, alcohol: a }));
                        next();
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "familyHistory" && (
              <div className="space-y-2">
                <div className="text-sm">Any family medical history? (Select all that apply)</div>
                <div className="flex flex-wrap gap-2">
                  {FAMILY_KEYS.map((k) => (
                    <button
                      key={k}
                      className={`rounded-md border px-3 py-2 text-sm ${draft.familyHistory.includes(k) ? "bg-primary text-white" : "hover:bg-muted"}`}
                      onClick={() => toggleHistory(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div>
                  <button className="mt-2 rounded-md bg-primary px-4 py-2 text-white" onClick={next}>Next</button>
                </div>
              </div>
            )}

            {step === "lab" && (
              <div className="space-y-2">
                <div className="text-sm">Optionally, upload a sample lab report (not uploaded anywhere).</div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setLabName(e.target.files?.[0]?.name || null)}
                  className="rounded-md border px-3 py-2"
                />
                <div className="flex gap-2">
                  <button className="rounded-md bg-primary px-4 py-2 text-white" onClick={finalize}>Generate Plan</button>
                  <button className="rounded-md border px-4 py-2" onClick={finalize}>Skip</button>
                </div>
              </div>
            )}
          </div>
        )}

        {profile && plan && (
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="rounded-md bg-muted p-3">
                Great! Based on your answers, here’s a simple preventive care plan.
              </div>
              {labName && (
                <div className="rounded-md bg-muted p-3">
                  Noted sample lab file: <span className="font-medium">{labName}</span>
                </div>
              )}
            </div>

            <PlanDisplay plan={plan} user={profile} />

            <div className="text-center text-xs text-muted-foreground">
              Want to start over?{' '}
              <button
                onClick={() => {
                  setProfile(null);
                  setLabName(null);
                  setDraft({ familyHistory: [] });
                  setAgeInput("");
                  setStep("age");
                }}
                className="underline"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
