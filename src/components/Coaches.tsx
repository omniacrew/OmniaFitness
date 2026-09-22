"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import MagneticButton from "@/components/MagneticButton";
import Proximate from "@/components/variable-proximity/Proximate";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Coach = {
  id: string;
  name: string;
  imagePink: string;
  imageNormal: string;
  bio: string;
};

type CoachPhase =
  | "idle"
  | "opening_slide"
  | "opening_fade"
  | "opening_bio"
  | "closing_hide_bio"
  | "closing_fade_in"
  | "closing_slide_back";

/** Bio choreography — overlapping beats (slide + peer fade + bio run together, not strictly serial) */
const D_SLIDE_MS = 220;
const D_FADE_MS = 130;
const D_BIO_MS = 130;
const TIMEOUT_SLACK_MS = 24;
/** Start hiding peers this many ms after open (mid-slide). */
const OPEN_PEER_FADE_AT_MS = 55;
/** Start bio panel fade-in this many ms after open (overlaps slide + peer fade). */
const OPEN_BIO_AT_MS = 75;
/** Close: start bringing peers back mid bio-out. */
const CLOSE_PEERS_IN_AT_MS = 55;
/** Close: start slide-back before bio-out fully finishes. */
const CLOSE_SLIDE_AT_MS = 85;

const COACH_ORDER = [
  "marykay",
  "jason",
  "julia",
  "arturo",
  "dan",
  "jake",
  "kat",
  "victoria",
  "chris",
  "lexie",
  "rachel",
] as const;

const COACHES_UNSORTED: Coach[] = [
  {
    id: "julia",
    name: "Julia",
    imagePink: "/coaches/julia-pink.png",
    imageNormal: "/coaches/julia.png",
    bio: `Hey! I'm Julia Zoukhri (Zoo-cree). I'm originally from Somerville, Massachusetts, and moved to Denver in 2019 after completing two years of service in Benin, West Africa as a Peace Corps Volunteer in the public health sector.

I found CrossFit in December 2019 and quickly fell in love with the combination of challenge, community, and growth it provided — especially during the pandemic. I joined Omnia in 2021 and started coaching in 2023. My athletic background is primarily in running and swimming but have picked up pickleball in my ripe old age of 30-something. In 2025, I trained for and completed my first marathon in Sydney, Australia, and I hope to complete all seven World Marathon Majors in my lifetime.

Outside of coaching, I wear many hats, but two of my favorites are mental performance consultant and dog mom. As a mental performance consultant, I work directly with athletes — mainly CrossFit athletes and distance runners — on confidence, managing pressure, mindfulness, attentional control, and other mental skills that support both performance and wellbeing.

A few additional random facts about me: I'm French and Moroccan and grew up speaking French. I earned my black belt in karate when I was 15 years old. I love cooking, hiking, traveling, and spending time with my partner and our two senior dogs.`,
  },
  {
    id: "jason",
    name: "Jason",
    imagePink: "/coaches/jason-pink.png",
    imageNormal: "/coaches/jason.png",
    bio: `Growing up playing sports was a way of life - from football, baseball, and wrestling to cycling in my early 20's. Starting a business in my mid 20's eclipsed most of my time and it wasn't until my early 30s I started engaging fitness very seriously again. Working back into strength and conditioning was an intense mountain to climb but was a serious priority. I took over ownership of Omnia in 2025 and feel an immense sense of pride to keep pushing myself and our members towards their fitness goals.`,
  },
  {
    id: "arturo",
    name: "Arturo",
    imagePink: "/coaches/arturo-pink.png",
    imageNormal: "/coaches/arturo.png",
    bio: `Born and raised in Des Moines, Iowa. I've been in Denver for a little over 5 years now! I absolutely love spending time with my loved ones and getting out to explore either here in the mountains or out in the world any chance I can get. I've been doing Crossfit for a little over 8 years now. I got introduced to it after I retired from College football. Forever grateful to have found this community!`,
  },
  {
    id: "dan",
    name: "Dan",
    imagePink: "/coaches/dan-pink.png",
    imageNormal: "/coaches/dan.png",
    bio: `I've been coaching CrossFit since 2013 and have received the L1 and L2 certifications, along with attending i99 Gymnastics, Olympic weightlifting and Rowing seminars. I've had the incredible opportunity to compete at the 2021 CrossFit Games as part of Team Omnia. I'm passionate about helping athletes move well, build confidence, and become the best version of themselves—inside and outside the gym. When I'm not coaching, you'll probably find me enjoying a hazy IPA or bourbon, watching sports, or hanging out with my pup. I'm always down to help, whether it's dialing in your mechanics or just getting to know your story.`,
  },
  {
    id: "jake",
    name: "Jake",
    imagePink: "/coaches/jake-pink.png",
    imageNormal: "/coaches/jake.png",
    bio: `Jake was exposed to strength and conditioning in junior high to improve his sports performance. From a young age he played football, soccer, baseball and wrestling (team captain). As an adult, he found a passion for lifting weights and endurance, competing in a few half-marathons. Jake found the CrossFit methodology in 2013 and it has been his foundation for fitness and nutrition ever since. He completed his CrossFit Level 1 certification in 2019 and began coaching in March of 2023 at Omnia. He completed his CrossFit Level 2 certification in 2023.`,
  },
  {
    id: "marykay",
    name: "MaryKay",
    imagePink: "/coaches/marykay-pink.png",
    imageNormal: "/coaches/marykay.png",
    bio: `MK started her crossfit journey back in 2015 with a Groupon to a crossfit gym in the suburbs of Chicago. As a former gymnast, she immediately fell in love with the competitive aspect of class, the environment, and the community.

Shortly after, MK took her L1 and started her coaching career, after already having done a few years of personal training. She eventually moved to Chicago where she coached at Crossfit312 and then South Loop Strength and Conditioning. It was at SLSC that she met her Crossfit coach and started competitively training in 2017.

MK competed at Regionals individually in 2018, moved to Denver to train at Omnia in 2020, then became part of a new Omnia team that went on to compete at the Crossfit Games in 2021, 2022, and 2023 where they had two top 10 finishes!

MK is the Director of Operations at Omnia and currently specializes in coaching gymnastics skills, and writing individual programming for members who want extra work towards a variety of goals.

Overall, MK has a deep love of coaching, being surrounded by like-minded individuals, and strives to help others become their best selves and live their most fulfilled lives, inside and out of the gym.`,
  },
  {
    id: "kat",
    name: "Kat",
    imagePink: "/coaches/kat-pink.png",
    imageNormal: "/coaches/kat.png",
    bio: `Coaching since 2018, Kathleen believes CrossFit is about far more than workouts — it's about helping people believe in themselves.
She fell in love with CrossFit because of what it builds from the inside out: confidence, resilience, and proof that you can do hard things. Nothing excites her more than watching an athlete hit a first pull-up, lift heavier than they thought possible, or simply show up on a hard day. She truly gets more excited about her athletes' wins than her own.
Kathleen coaches with the mindset that fitness should support you through every stage of life — whether you're brand new, rebuilding, pregnant, postpartum, career-focused, or chasing big goals. She's approachable, encouraging, and practical, meeting you where you are while helping you grow.
Outside the gym, she's a financial planner, a mom, and someone who's always chasing growth — in strength, career, and life. She loves traveling with her family, baking, reading, and cheering the loudest during workouts.
Her mission: help you see what you're capable of — and then go beyond it.`,
  },
  {
    id: "victoria",
    name: "Victoria",
    imagePink: "/coaches/victoria-pink.png",
    imageNormal: "/coaches/victoria.png",
    bio: `Victoria is a longtime CrossFit athlete and coach who loves combining structured training with a strong sense of fun and community. She started CrossFit right after graduating high school and quickly fell in love with the sport. In 2019, she began coaching CrossFit and nutrition at CrossFit 845, later coaching at CrossFit Boston before making her home at Omnia. Professionally, she works as a sports dietitian supporting the nutrition needs of competitive athletes at every level. Victoria is passionate about helping people train hard without burning out or under-fueling. When she's coaching, her goal is to make you feel supported, capable, and confident in your body.`,
  },
  {
    id: "chris",
    name: "Chris",
    imagePink: "/coaches/chris-pink.png",
    imageNormal: "/coaches/chris.png",
    bio: `As a lifelong athlete, Chris has always been drawn to competition, teamwork, and pushing limits. He played soccer throughout high school and college where he developed a deep appreciation for discipline, camaraderie, and the drive to constantly improve.

About seven years ago, he was introduced to CrossFit and immediately fell in love with the challenge, intensity, and community that define the sport. After a few years he was able to connect the CrossFit activity with his passion for training which started his coaching career.

Outside the gym, Chris works full-time as a firefighter, a career that demands resilience, teamwork, and a commitment to helping others succeed under pressure. That same mindset carries into his coaching. He invested in each athlete's journey and believes that progress comes from focused coaching, intentional training, and individualized attention.

When Chris is not coaching or on shift at the firehouse, you can usually find him outdoors rafting, fishing, or camping, or cheering on one of the many local sports teams.`,
  },
  {
    id: "lexie",
    name: "Lexie",
    imagePink: "/coaches/lexie-pink.png",
    imageNormal: "/coaches/lexie.png",
    bio: `Hi, I'm Lexie. Originally from Texas, living in Colorado, and I've been coaching CrossFit since 2019.

I'm also a pre-med student who loves sports, whether I'm in the gym, studying, or trying (and humbly failing) to master other sports.`,
  },
  {
    id: "rachel",
    name: "Rachel",
    imagePink: "/coaches/rachel-pink.png",
    imageNormal: "/coaches/rachel.png",
    bio: `Growing up a three-sport athlete, Rachel played club volleyball at Michigan State - but never touched a weight until an exercise physiology professor tested her fitness in undergrad and told her she was strong. That planted the seed, bringing her to CrossFit in 2014 at the start of graduate school and was hooked fast, competing at Regionals with a team in 2015 and 2016 out of Grand Rapids, Michigan.

With a background in Kinesiology and a Master's in Occupational Therapy, Rachel has always seen fitness and function as two sides of the same coin — a philosophy that led her to coach adaptive athletes at CrossFit Watchtower, working with people living with MS and other neurological diagnoses. It's a population she remains passionate about and hopes to return to someday.

She packed her car in 2021 with two days of Colorado experience under her belt, craving a new chapter. She wasn't planning on competing again - but she found Omnia and jumped into the mix.

Nearly 11 years of coaching across Orangetheory, CrossFit, and her own outdoor self-run programs through Covid have shaped one core belief: your time here should be worth it. Rachel is a movement nerd who loves clean technique, purposeful progressions, and helping people surprise themselves. Outside the gym she runs R.Elery Coaching, co-founded TailoredHealth, and can be found on the beach volleyball court or borrowing everyone's dogs.`,
  },
];

const COACHES: Coach[] = COACH_ORDER.map(
  (id) => COACHES_UNSORTED.find((c) => c.id === id)!
);

function bioFontClass(bio: string) {
  const n = bio.length;
  if (n > 2000) {
    return "text-[0.68rem] leading-snug md:text-xs";
  }
  if (n > 1300) {
    return "text-xs leading-snug md:text-sm";
  }
  if (n > 700) {
    return "text-xs leading-relaxed md:text-sm";
  }
  return "text-sm leading-relaxed md:text-base";
}

export default function Coaches() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timersRef = useRef<number[]>([]);

  const [phase, setPhase] = useState<CoachPhase>("idle");
  const [bioCoachId, setBioCoachId] = useState<string | null>(null);
  const [trackTranslateX, setTrackTranslateX] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback(
    (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
    },
    []
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setScrollProgress(max > 0 ? scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    if (phase !== "idle") return;
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [phase, handleScroll]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const activeCoach = bioCoachId
    ? COACHES.find((c) => c.id === bioCoachId) ?? null
    : null;

  const othersHidden =
    phase === "opening_fade" ||
    phase === "opening_bio" ||
    phase === "closing_hide_bio";

  const bioVisible = phase === "opening_bio";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mobile = !window.matchMedia("(min-width: 768px)").matches;
    if (mobile && bioVisible && bioCoachId) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [bioVisible, bioCoachId]);

  const transformTransitionStyle =
    reduceMotion || phase === "idle"
      ? "none"
      : phase === "opening_slide" || phase === "closing_slide_back"
        ? `transform ${D_SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        : "none";

  const coachOpacityTransition = reduceMotion
    ? "none"
    : `opacity ${D_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  const bioOpacityTransition = reduceMotion
    ? "none"
    : `opacity ${D_BIO_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  const isDesktopCoachLayout = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches;

  const openBio = (coachId: string) => {
    if (phase !== "idle") return;
    const idx = COACHES.findIndex((c) => c.id === coachId);
    const col = colRefs.current[idx];
    const scroll = scrollRef.current;
    if (!col || !scroll) return;

    const endT = scroll.scrollLeft - col.offsetLeft;
    const desktop = isDesktopCoachLayout();

    clearTimers();
    setBioCoachId(coachId);
    setTrackTranslateX(0);

    if (!desktop) {
      setPhase("opening_bio");
      return;
    }

    if (reduceMotion) {
      setTrackTranslateX(endT);
      setPhase("opening_bio");
      return;
    }

    setPhase("opening_slide");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTrackTranslateX(endT);
      });
    });

    schedule(() => {
      setPhase("opening_fade");
    }, OPEN_PEER_FADE_AT_MS);

    schedule(() => {
      setPhase("opening_bio");
    }, OPEN_BIO_AT_MS);
  };

  const closeBio = () => {
    if (phase !== "opening_bio") return;

    clearTimers();

    const desktop = isDesktopCoachLayout();
    if (reduceMotion || !desktop) {
      setBioCoachId(null);
      setTrackTranslateX(0);
      setPhase("idle");
      return;
    }

    setPhase("closing_hide_bio");

    schedule(() => {
      setPhase("closing_fade_in");
    }, CLOSE_PEERS_IN_AT_MS);

    schedule(() => {
      setPhase("closing_slide_back");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTrackTranslateX(0);
        });
      });
    }, CLOSE_SLIDE_AT_MS);

    const settleMs = CLOSE_SLIDE_AT_MS + D_SLIDE_MS + TIMEOUT_SLACK_MS * 2;

    schedule(() => {
      setBioCoachId(null);
      setPhase("idle");
    }, settleMs);
  };

  const busy = phase !== "idle";
  const showProgress = phase === "idle";
  const showClose = bioCoachId !== null;

  return (
    <section className="relative bg-white py-16 md:py-24">
      {showClose && (
        <button
          type="button"
          onClick={closeBio}
          disabled={!bioVisible || phase.startsWith("closing")}
          className="absolute right-4 top-4 z-30 hidden h-10 w-10 items-center justify-center font-mono text-2xl leading-none text-black transition-opacity hover:opacity-50 disabled:pointer-events-none disabled:opacity-30 md:right-6 md:top-6 md:flex"
          aria-label="Close coach bio"
        >
          ×
        </button>
      )}

      <div
        aria-busy={busy}
        className="flex flex-col px-6 [--coach-card:280px] md:[--coach-card:320px]"
      >
        <div className="relative flex flex-col">
          <div
            className={`relative min-h-0 ${busy ? "overflow-hidden" : ""}`}
          >
            <div
              ref={scrollRef}
              data-lenis-prevent-touch
              className={`touch-pan-x min-h-0 pb-2 [&::-webkit-scrollbar]:hidden ${
                phase === "idle"
                  ? "overflow-x-auto"
                  : "overflow-x-hidden overflow-y-hidden"
              }`}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div
                ref={trackRef}
                role="list"
                className="relative flex w-max gap-6"
                style={{
                  transform: `translate3d(${trackTranslateX}px,0,0)`,
                  transition: transformTransitionStyle,
                }}
              >
                {COACHES.map((coach, index) => {
                  const selected = coach.id === bioCoachId;
                  const dimOthers = othersHidden && !selected;
                  const showNormal = selected && bioCoachId !== null;

                  return (
                    <div
                      key={coach.id}
                      ref={(el) => {
                        colRefs.current[index] = el;
                      }}
                      role="listitem"
                      aria-hidden={dimOthers}
                      className={`card-lift-hover flex w-[var(--coach-card)] flex-shrink-0 flex-col ${
                        dimOthers ? "pointer-events-none" : ""
                      } ${selected && busy ? "relative z-20" : ""}`}
                      style={{
                        opacity: dimOthers ? 0 : 1,
                        transition: coachOpacityTransition,
                      }}
                    >
                      <div className="group relative aspect-square w-full overflow-hidden border border-black">
                        {!showNormal ? (
                          <>
                            <Image
                              src={coach.imagePink}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 280px, 320px"
                              aria-hidden
                            />
                            <Image
                              src={coach.imageNormal}
                              alt={coach.name}
                              fill
                              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                              sizes="(max-width: 768px) 280px, 320px"
                            />
                          </>
                        ) : (
                          <Image
                            src={coach.imageNormal}
                            alt={coach.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 280px, 320px"
                            priority={selected}
                          />
                        )}
                      </div>
                      {!othersHidden || !selected ? (
                        <div className="pt-3">
                          <h3 className="mb-3 font-mono text-base font-normal text-black md:text-lg">
                            <Proximate>{coach.name}</Proximate>
                          </h3>
                          <MagneticButton
                            disabled={phase !== "idle"}
                            onClick={() => openBio(coach.id)}
                            className="rounded-lg border-2 border-black bg-white px-4 py-2 font-mono text-xs uppercase tracking-widest text-black transition-all duration-300 hover:border-pink-primary hover:bg-pink-primary hover:text-black disabled:pointer-events-none disabled:opacity-40"
                          >
                            <Proximate>Read their Bio</Proximate>
                          </MagneticButton>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {activeCoach && (
              <div className="hidden md:contents">
                {/* Solid white behind bio so peer card slots (and any bleed) read as one field */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-y-0 right-0 z-[8] bg-white ${
                    othersHidden ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    left: "calc(var(--coach-card) + 1.5rem)",
                    transition: coachOpacityTransition,
                  }}
                />
                <div
                  className={`absolute inset-y-0 right-0 z-10 flex min-h-0 min-w-0 flex-col ${
                    bioVisible
                      ? "pointer-events-none opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                  style={{
                    left: "calc(var(--coach-card) + 1.5rem)",
                    transition: bioOpacityTransition,
                  }}
                >
                  <div
                    className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-white pr-3 pt-1 md:pr-6 ${
                      bioVisible ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                  >
                    <h2 className="mb-3 shrink-0 font-mono text-lg font-normal text-black md:text-xl">
                      <Proximate>{activeCoach.name}</Proximate>
                    </h2>
                    <div
                      className={`min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain font-mono font-normal text-black ${bioFontClass(activeCoach.bio)}`}
                    >
                      {/* Plain text: Proximate uses per-word nowrap and breaks long bio layout */}
                      <p className="max-w-full whitespace-pre-line break-words pb-4 pr-1">
                        {activeCoach.bio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showProgress && (
            <div className="mt-3 shrink-0">
              <div className="h-1 bg-black/20">
                <div
                  className="h-1 bg-black transition-all duration-150"
                  style={{
                    width: `${Math.max(20, scrollProgress * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {activeCoach && bioVisible ? (
        <div
          role="dialog"
          aria-modal
          aria-labelledby="coach-bio-sheet-title"
          className="fixed inset-0 z-[10001] flex min-h-0 flex-col bg-white md:hidden"
          style={{
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-black/15 pb-3">
            <h2
              id="coach-bio-sheet-title"
              className="min-w-0 font-mono text-lg font-normal text-black"
            >
              <Proximate>{activeCoach.name}</Proximate>
            </h2>
            <button
              type="button"
              onClick={closeBio}
              className="flex h-10 w-10 shrink-0 items-center justify-center font-mono text-2xl leading-none text-black transition-opacity hover:opacity-50"
              aria-label="Close coach bio"
            >
              ×
            </button>
          </div>
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 font-mono font-normal text-black ${bioFontClass(activeCoach.bio)}`}
          >
            <p className="max-w-full whitespace-pre-line break-words pb-4">
              {activeCoach.bio}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
