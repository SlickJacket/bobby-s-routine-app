export interface FilledField {
  label: string;
  value: string;
}

export interface WorkedExample {
  title: string;
  creator: string;
  year: string;
  tool: string;
  breakdown: string;
  filled: FilledField[];
}

export interface ReferenceBook {
  title: string;
  author: string;
  why: string;
  points: string[];
}

export interface ReferenceCategory {
  key: string;
  label: string;
  intro: string;
  examples: WorkedExample[];
  books: ReferenceBook[];
}

export const REFERENCE_CATEGORIES: ReferenceCategory[] = [
  {
    key: "Standup",
    label: "Standup",
    intro:
      "The Bit List template (Premise → Punchline → Tag) is a default, not a law. The clearest comics follow it closely; the best also know exactly when and why to break it.",
    examples: [
      {
        title: "The Tennessee Kid",
        creator: "Nate Bargatze",
        year: "2019, Netflix",
        tool: "Bit List (textbook case)",
        breakdown:
          "Bargatze's material — air travel, cheap weddings, ordering coffee — is almost a demonstration reel for the Bit List template: one plain Premise, one clean Punchline, and often a single, perfectly-placed Tag, all delivered so deadpan the tag lands as a quiet surprise instead of a shout.",
        filled: [
          {
            label: "Premise",
            value:
              "Ordering an iced coffee with cream keeps getting misheard as \"milk with ice\" at Starbucks, no matter how he phrases it.",
          },
          {
            label: "Punchline",
            value:
              "A barista in San Francisco repeats the order back correctly — \"iced coffee with cream\" — then hands him a coffee buried in whipped cream anyway.",
          },
          {
            label: "Tag",
            value:
              "He carries the whipped-cream drink through the crowd, too embarrassed to send it back, then just quietly starts over at a different counter instead of ever explaining what he actually wanted — undercutting his own premise (\"I don't think things through\") one more time.",
          },
        ],
      },
      {
        title: "The Moth Joke",
        creator: "Norm Macdonald",
        year: "2009, Conan O'Brien",
        tool: "Bit List (the exception that proves the rule)",
        breakdown:
          "Macdonald takes what could be a two-line Bit List entry and deliberately stretches it into a meandering, four-minute digression styled after 19th-century Russian literature. Once you understand why the Premise → Punchline → Tag economy works, this is the reference for how to break it on purpose — the length and the detour ARE the joke.",
        filled: [
          { label: "Premise", value: "A moth walks into a podiatrist's office." },
          {
            label: "Punchline",
            value:
              "(withheld for roughly four minutes of Kafkaesque digression about the moth's family and miseries, all the moth's relatives given Russian names, in the voice of a 19th-century Russian novelist.)",
          },
          {
            label: "Tag",
            value:
              "\"'Cause the light was on.\" Delivered so late and so small that the real punchline is the delay itself, not the line — Macdonald insisted the joke was simply a very good joke, not a comment on bad joke structure.",
          },
        ],
      },
      {
        title: "Humanity / Armageddon",
        creator: "Ricky Gervais",
        year: "2018 / 2023, Netflix",
        tool: "Beat Sheet or Brainstorm page (not Bit List)",
        breakdown:
          "Gervais doesn't move bit-to-bit — he takes one premise (offense, mortality, AI) and escalates a single argument for five-plus minutes, circling back to earlier lines as callbacks. If your material works this way, open a Brainstorm or Beat Sheet page instead of a Bit List.",
        filled: [
          {
            label: "Opening claim",
            value: "A flatly-stated, almost throwaway opinion — about offense-taking, mortality, or a social norm.",
          },
          {
            label: "Escalation",
            value: "Restates and defends the opinion more aggressively each time, arguing against an imagined objection from the audience.",
          },
          {
            label: "Callback",
            value: "An earlier small phrase or example gets reused later as evidence for a completely different tangent.",
          },
          {
            label: "Closing turn",
            value: "The aggressive tone resolves into something more personal or vulnerable than it first suggested.",
          },
        ],
      },
      {
        title: "Standup sets",
        creator: "Chris D'Elia",
        year: "ongoing",
        tool: "Bit List as a seed, not the whole joke",
        breakdown:
          "D'Elia's material leans on physical act-outs, impressions, and crowd work — the written premise is a jumping-off point rebuilt live every night, not a fixed script.",
        filled: [
          { label: "Premise", value: "Written down ahead of time — an awkward life moment, an internet-culture observation." },
          { label: "Punchline", value: "Left blank on purpose — sold live through physical act-outs and facial expression rather than a written line." },
          { label: "Tag", value: "Built in real time from crowd work, different every night depending on what the room gives him." },
        ],
      },
    ],
    books: [
      {
        title: "Born Standing Up",
        author: "Steve Martin",
        why: "The best standup memoir there is — what it actually costs to build an act, from someone who then walked away from it at the top.",
        points: [
          "Martin spent years deliberately removing punchlines from his act on the theory that if the audience never got the release of a clear \"joke,\" tension (and laughter) would keep building across the whole set instead of resetting after every line.",
          "He treated stagecraft — props, a fake arrow through the head, a stark white suit — as jokes in themselves, not decoration around the jokes.",
          "He walked away from standup at the height of his fame specifically because the persona had become a trap: a discipline lesson as much as a craft one — know when a bit has finished doing its job.",
        ],
      },
      {
        title: "Sick in the Head",
        author: "Judd Apatow",
        why: "Decades of Apatow's own interviews with comedians — less \"how to write a joke,\" more how comedians actually think about craft and career.",
        points: [
          "Almost every comedian interviewed points to a specific early rejection or failure as the actual origin of their voice, not a natural gift — the flop is data, not a verdict.",
          "Across the interviews, working comedians care less about structure questions than about \"what am I actually trying to say\" — the premise has to be true to the comedian, not just clever.",
          "The book is built as accumulated, cross-generational conversation (one comic's advice getting passed to the next) — comedy craft gets taught mouth-to-mouth, not from a manual.",
        ],
      },
      {
        title: "Poking a Dead Frog",
        author: "Mike Sacks",
        why: "Interviews with working comedy writers that get specific about process — useful for both standup and sketch.",
        points: [
          "Includes genuinely specific breakdowns of joke mechanics most books skip — like the exact anatomy of a \"topper\"/tag, directly relevant to the Bit List's third column.",
          "Multiple writers featured stress ruthless rewriting — the first version of a joke is a draft of the premise, not the joke itself.",
          "Treats standup and sketch/TV writing as the same underlying skill (finding the true, specific detail) aimed at different formats.",
        ],
      },
    ],
  },
  {
    key: "Sketch",
    label: "Sketch",
    intro:
      "A sketch lives or dies on one clearly-stated game that escalates. There's no time in a live show to explain the joke — it has to be obvious fast.",
    examples: [
      {
        title: "More Cowbell",
        creator: "Saturday Night Live (Will Ferrell, Christopher Walken)",
        year: "2000",
        tool: "Beat Board (compressed to 5 cards)",
        breakdown:
          "The cleanest teaching sketch there is because the structure is almost a pure escalation loop, with the game stated out loud partway through so the audience knows exactly what to expect for the rest of the runtime.",
        filled: [
          {
            label: "Card 1 — Premise",
            value: "A band is recording \"(Don't Fear) The Reaper.\" The producer says it's \"a dynamite sound\" — then stops the take.",
          },
          {
            label: "Card 2 — Escalation 1",
            value: "Producer: \"a little more cowbell.\" The cowbell player is told to \"really explore the studio space this time.\"",
          },
          {
            label: "Card 3 — Escalation 2",
            value: "The cowbell playing gets physically bigger — dancing into bandmates, shirt riding up, the rest of the band visibly annoyed.",
          },
          {
            label: "Card 4 — Game named out loud",
            value: "The producer states the rule explicitly: \"I've got a fever, and the only prescription is more cowbell.\"",
          },
          {
            label: "Card 5 — Button",
            value: "A final look to camera closes it out — no new joke, just confirmation that the game is officially over.",
          },
        ],
      },
    ],
    books: [
      {
        title: "Live From New York",
        author: "Tom Shales & James Andrew Miller",
        why: "The oral history of SNL, in the writers' and performers' own words — shows how an actual sketch room decides what's funny, fast, under a live deadline.",
        points: [
          "Writers repeatedly describe Wednesday table-reads where 40-plus sketches get read and only a handful survive to dress rehearsal — a volume-and-cutting model, not precious single-idea perfectionism.",
          "Performers and writers describe the premise needing to be \"gettable\" in the first ten seconds as a hard live-TV constraint — directly the reason Brainstorm's \"what's funny about it\" field belongs before anything else gets written.",
          "Much of the show's most famous material is described as written FOR a specific performer's physical strengths (like Ferrell's willingness to commit fully) rather than written blind and cast later.",
        ],
      },
      {
        title: "Poking a Dead Frog",
        author: "Mike Sacks",
        why: "Also interviews SNL and Kids in the Hall writers directly on sketch structure and the writers'-room process.",
        points: [
          "Interview subjects on sketch repeatedly stress \"the game\" — a repeatable comedic rule you can escalate — as the actual structural unit of a sketch, not plot.",
          "Several writers say to assume the first 30 seconds get trimmed in editing — the real premise should be able to survive losing its setup entirely.",
        ],
      },
      {
        title: "Yes, And",
        author: "Kelly Leonard & Tom Yorton",
        why: "From Second City's own leadership — less about joke mechanics, more about the improv instinct most sketch writing comes out of.",
        points: [
          "\"Yes, and\" is framed as a discipline for building on a scene partner's offer instead of blocking it — the actual mechanism that produces a \"game\" worth escalating.",
          "Second City's pipeline treats sketch writing as downstream of improvisation: sketches get mined from what already made a live room laugh, not invented cold on a blank page.",
        ],
      },
    ],
  },
  {
    key: "Short Story",
    label: "Short Story",
    intro:
      "Not every idea needs the full Beat Sheet machinery. Some of the most enduring short fiction runs on voice and a single incident, not plot engineering.",
    examples: [
      {
        title: "The Most Beautiful Woman in Town",
        creator: "Charles Bukowski",
        year: "1967 (collection)",
        tool: "Brainstorm page, stripped down",
        breakdown:
          "Bukowski's stories are unsentimental, plain-language, close-observational — built around a single incident or a single character sketch rather than a three-act plot.",
        filled: [
          {
            label: "Premise",
            value: "A specific incident, or a single day, in the life of someone on the margins — a barfly, a factory worker, someone between jobs.",
          },
          {
            label: "What's true about it",
            value: "The gap between how bleak the situation is and how flatly, unsentimentally the narrator describes it — the deadpan is the style.",
          },
          {
            label: "Audience",
            value: "Left blank on purpose — Bukowski wrote for himself, about people rarely written about, not toward a target demographic.",
          },
        ],
      },
      {
        title: "South of No North",
        creator: "Charles Bukowski",
        year: "1973",
        tool: "Scene economy",
        breakdown:
          "Stories about people on \"the buried life\" margins, almost none running more than two or three scenes. Each scene does exactly one job.",
        filled: [
          { label: "Scene 1", value: "Establish the person and the room — no backstory, start mid-situation." },
          { label: "Scene 2", value: "One thing happens that changes the room's temperature, without being explained." },
          { label: "Scene 3 (often omitted)", value: "A short aftermath, deliberately underplayed — no moral stated." },
        ],
      },
    ],
    books: [
      {
        title: "On Writing",
        author: "Stephen King",
        why: "Part memoir, part blunt craft advice — the same \"write it plain, cut what doesn't earn its place\" ethic Bukowski worked in, from a very different writer.",
        points: [
          "The \"toolbox\" metaphor: vocabulary and grammar sit at the bottom of the box, but the real tools are habits — write every day, read constantly.",
          "\"The road to hell is paved with adverbs\" — a specific, concrete first-pass editing rule.",
          "\"Write with the door closed, rewrite with the door open\" — the first draft is private and undistracted; only the second draft considers an audience.",
        ],
      },
      {
        title: "Reading Like a Writer",
        author: "Francine Prose",
        why: "A close-reading craft book that teaches you to reverse-engineer any writer's technique sentence by sentence.",
        points: [
          "Teaches close reading at the level of individual words and sentences, not just plot or theme — repeatedly asking \"why this word, here.\"",
          "Argues most writing craft is actually learned by imitating admired writers' sentence-level choices, not from workshop rules — exactly the method this Reference tab applies to comedy and film.",
        ],
      },
      {
        title: "The Most Beautiful Woman in Town",
        author: "Charles Bukowski",
        why: "The primary text. Read the thing you're trying to learn from before you read anything about it.",
        points: [
          "Almost never opens with backstory — starts mid-scene, in a bar or a room, and lets the reader catch up.",
          "Dialogue isn't punctuated by \"clever\" wit — characters talk like people avoiding a subject, not delivering lines.",
        ],
      },
    ],
  },
  {
    key: "Short Film",
    label: "Short Film",
    intro:
      "A short doesn't have time for all 15 Save the Cat beats — most compress to 5 or 6 and drop subplot machinery entirely. That's expected, not a shortcut.",
    examples: [
      {
        title: "Piper",
        creator: "Pixar (dir. Alan Barillaro)",
        year: "2016",
        tool: "Beat Sheet, compressed",
        breakdown:
          "Six minutes, zero dialogue, and it's a Beat Sheet in miniature. Because there's no dialogue, every beat has to be told through one clear physical action.",
        filled: [
          { label: "Opening Image", value: "Piper hides in the nest, refusing to go near the waves." },
          { label: "Catalyst", value: "Her mother demonstrates digging for food in the wet sand after a wave recedes." },
          { label: "All Is Lost (compressed)", value: "A wave knocks Piper down; she flees back to the nest, more afraid than before." },
          { label: "Break into Three", value: "A hermit crab shows her how to duck underwater and watch the wave from below instead of running from it." },
          { label: "Final Image", value: "Piper runs toward the water with the flock — a mirror of the Opening Image, reversed." },
        ],
      },
    ],
    books: [
      {
        title: "Rebel Without a Crew",
        author: "Robert Rodriguez",
        why: "How he shot El Mariachi for $7,000 — the scrappy, resourceful, \"use your constraints as the plan\" mindset short filmmaking runs on.",
        points: [
          "His \"10 Minute Film School\" idea: treat every budget or schedule constraint as a stylistic decision instead of a problem to hide (no crowd scenes because he couldn't afford extras, so he wrote around it).",
          "He wrote the script specifically around what he already had access to (a bus station, a bar, a friend's ranch) rather than writing first and scouting later.",
          "Storyboarded every shot in advance — pre-production efficiency is what makes a tiny crew possible at all, since there's no time on set to figure out coverage.",
        ],
      },
      {
        title: "In the Blink of an Eye",
        author: "Walter Murch",
        why: "A legendary editor on what actually makes a cut or a scene work — useful for figuring out where a short film's real beats live once it's shot.",
        points: [
          "The \"Rule of Six\": a good cut should be true to (1) Emotion, (2) Story, (3) Rhythm, (4) Eye-trace, (5) two-dimensional Planarity, (6) three-dimensional spatial continuity — in that priority order, not equally weighted.",
          "Emotion outranks everything below it: Murch argues an editor should be willing to break continuity or eyeline-matching rules the moment they get in the way of the feeling a scene needs.",
          "Directly useful for short film specifically: with limited coverage and few retakes, knowing which \"rule\" is safest to break first matters more than it does on a bigger production.",
        ],
      },
    ],
  },
  {
    key: "Feature",
    label: "Feature",
    intro:
      "The full 15-beat Beat Sheet exists for exactly this format. The best way to trust it is to fill it out for a movie you already know cold before you try it on something new.",
    examples: [
      {
        title: "Groundhog Day",
        creator: "dir. Harold Ramis",
        year: "1993",
        tool: "Beat Sheet (all 15 beats)",
        breakdown:
          "One of the cleanest real matches to Snyder's structure — worth filling out a Beat Sheet page for this movie before trying one on an original idea, just to see what each beat is actually asking for.",
        filled: [
          { label: "Opening Image", value: "Phil, smug and contemptuous, mocking the assignment before he even leaves the newsroom." },
          { label: "Theme Stated", value: "Someone tells Phil, in effect, that his self-regard is the actual problem — he isn't listening yet." },
          { label: "Set-Up", value: "Phil arrives in Punxsutawney and treats the town and Rita with open contempt." },
          { label: "Catalyst", value: "He wakes up to \"I Got You Babe\" again — it's Groundhog Day, on repeat." },
          { label: "Debate", value: "Confusion and denial, testing whether the loop is really happening." },
          { label: "Break into Two", value: "He accepts the loop is real and starts exploiting it with zero consequences." },
          { label: "B Story", value: "His pursuit of Rita begins in earnest — this is where the theme actually lives." },
          { label: "Fun and Games", value: "A selfishness spree: theft, gluttony, seduction attempts, no repercussions." },
          { label: "Midpoint", value: "Manipulating the loop for personal gain stops being satisfying — a false victory that curdles." },
          { label: "Bad Guys Close In", value: "Every attempt to win Rita honestly fails because he's still faking it." },
          { label: "All Is Lost", value: "The suicide montage — he's run out of ways to escape or exploit the loop." },
          { label: "Dark Night of the Soul", value: "He stops fighting the loop and starts using the time to actually get better at things, for their own sake." },
          { label: "Break into Three", value: "He commits to being genuinely good for one full day, expecting nothing back." },
          { label: "Finale", value: "The \"best day\": piano recital, ice sculpture, saving townspeople, earning Rita's real interest — none of it angling to end the loop." },
          { label: "Final Image", value: "He wakes up and the day has actually changed — mirrors the Opening Image, but Phil is generous now instead of contemptuous." },
        ],
      },
    ],
    books: [
      {
        title: "Save the Cat!",
        author: "Blake Snyder",
        why: "Already built into Green Room's Beat Sheet template — worth reading the source directly for the reasoning behind each beat.",
        points: [
          "The \"Save the Cat\" moment itself: early on, the hero does something small and decent, unrelated to the plot, purely so the audience decides to root for them.",
          "The \"Pope in the Pool\": bury necessary exposition inside a scene that's inherently entertaining on its own, so the audience absorbs information without feeling lectured.",
          "The 10 genres (Monster in the House, Golden Fleece, and so on) exist so you compare your idea against movies that solve the same structural problem, regardless of surface genre — a rom-com and a heist film can be the same \"genre\" in this sense.",
        ],
      },
      {
        title: "Story",
        author: "Robert McKee",
        why: "The other pole from Snyder: less beat-counting, more about how individual scenes turn on value-charged conflict.",
        points: [
          "The \"Controlling Idea\": one sentence stating what the story proves about human experience (a value plus the cause of that value) — decided before you outline scenes, not discovered after.",
          "\"The Gap\": every scene should open a gap between what a character expects to happen and what actually happens; without the gap, nothing dramatic occurred, only information was exchanged.",
          "Scenes turn on a change in \"value\" (justice/injustice, alive/dead, love/hate) — if the emotional charge is the same at the end of a scene as at the start, cut the scene.",
        ],
      },
      {
        title: "Adventures in the Screen Trade",
        author: "William Goldman",
        why: "\"Nobody knows anything.\" A working screenwriter's memoir on how little of any theory — including this one — survives contact with an actual production.",
        points: [
          "\"Nobody knows anything\": no one in Hollywood, including Goldman, can reliably predict what will succeed — offered as a reason to trust your own read on the material rather than chasing what already worked.",
          "Frames screenwriting as fundamentally structural (where do the surprises go, what does the audience know versus what the character knows) more than a dialogue-writing job.",
        ],
      },
    ],
  },
  {
    key: "Clowning",
    label: "Clowning",
    intro:
      "Clowning applies the same character and structure thinking as everything else here, just aimed at a live performer instead of a page or a screen.",
    examples: [
      {
        title: "Jack Tucker",
        creator: "Zach Zucker",
        year: "2017–present",
        tool: "Character Notes, applied to a stage persona",
        breakdown:
          "Zucker trained at École Philippe Gaulier — the Paris clown school that also produced Sacha Baron Cohen and Emma Thompson — then co-devised \"Jack Tucker,\" a cartoonishly dim-witted standup persona, with Jonny Woolley and Dylan Woodley in 2017.",
        filled: [
          { label: "Want (external)", value: "Be recognized as a great, serious standup comedian." },
          { label: "Need (internal)", value: "He doesn't have one he's aware of — that's the joke. The audience can see the real need; he can't." },
          { label: "Flaw", value: "A near-total absence of self-awareness — cartoonish dimness." },
          { label: "Voice", value: "Confident and declarative, delivered exactly like a comedian who's actually killing, regardless of what's really happening in the room." },
          { label: "Relationships", value: "Co-devised as a persona with Jonny Woolley and Dylan Woodley in 2017 — built collaboratively from the start, not solo." },
          { label: "Arc", value: "None, by design. A clown persona like this doesn't grow across a special the way a screenplay lead would — the joke depends on him staying exactly this oblivious." },
        ],
      },
      {
        title: "The flop as a structural unit",
        creator: "Lecoq / Gaulier clown lineage",
        year: "ongoing tradition",
        tool: "Beat Board, repurposed",
        breakdown:
          "Clown training in the Lecoq-descended lineage treats a visible, honest failure — \"the flop\" — as the basic structural unit of a clown show. Repurpose the Beat Board's columns as a sequence of escalating flops instead of plot beats.",
        filled: [
          { label: "Card 1 — small flop", value: "The character tries the simplest version of the goal and fails in a small, believable way." },
          { label: "Card 2 — bigger flop", value: "Tries again, adjusting — fails bigger, but the audience is now complicit and enjoying the failure with him." },
          { label: "Card 3 — the real flop", value: "The biggest, most honest failure of the sequence — per Gaulier's teaching, the one that has to actually cost the performer something to show." },
          { label: "Card 4 — recovery", value: "Instead of finally succeeding, the character finds a different, smaller pleasure entirely unrelated to the original goal — and that's the actual ending." },
        ],
      },
      {
        title: "Zach & Viggo / Stamptown Comedy Night",
        creator: "Zach Zucker & Viggo Venn / Zach Zucker",
        year: "ongoing",
        tool: "Beat Board as a runsheet",
        breakdown:
          "Zucker also builds shows as a duo act (with Viggo Venn, the Britain's Got Talent-winning clown) and as a recurring live variety night, Stamptown Comedy Night — both built around a clown host holding together other performers' material.",
        filled: [
          { label: "Card 1", value: "Host's opening bit — establishes the host persona's rules for the night." },
          { label: "Card 2", value: "Guest segment 1, introduced through the host's persona rather than a neutral intro." },
          { label: "Card 3", value: "Host callback — a recurring bit resurfaces between guests to hold the show together." },
          { label: "Card 4", value: "Guest segment 2, plus host reaction in character." },
          { label: "Card 5", value: "Closing bit — pays off the host's opening rule from Card 1." },
        ],
      },
    ],
    books: [
      {
        title: "The Moving Body (Le Corps Poétique)",
        author: "Jacques Lecoq",
        why: "The foundational text of the modern clown-training lineage Gaulier — and by extension Zucker — comes out of.",
        points: [
          "Training progresses neutral mask (stripping the performer's personal tics) → character mask → bouffon → clown, treating clown as the hardest, most personally exposing stage of training, not the easiest or silliest.",
          "A student's \"clown\" is discovered, not invented — it emerges from the specific ways that individual performer fails and gets laughed at, meaning no two clowns should look alike even after identical training.",
        ],
      },
      {
        title: "The Tormentor (Le Gégèneur)",
        author: "Philippe Gaulier",
        why: "Zucker's own teacher's book — playful and aphoristic, built around exercises rather than theory.",
        points: [
          "\"The flop is a part of myself\" — failure has to be shown honestly, not performed as a bit about failing.",
          "\"Complicité\" — a clown's relationship with the audience matters more than the material; being visibly present and connected to the room is what makes an audience decide to laugh at a failure instead of feeling bad for the performer.",
          "Built around roughly a hundred exercises rather than theory — the book itself models \"show, don't explain,\" the same way clown is taught in the room.",
        ],
      },
    ],
  },
];

export function findReferenceCategory(key: string | undefined): ReferenceCategory | undefined {
  return REFERENCE_CATEGORIES.find((c) => c.key === key);
}
