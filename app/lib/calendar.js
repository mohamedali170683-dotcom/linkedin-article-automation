// 52-Week Content Calendar with library sources
export const WEEKLY_CALENDAR = [
  // Q1: Behavioral Science Foundations
  { week: 1, topic: "Mental Availability", sources: "Sharp (How Brands Grow), Romaniuk (Building Distinctive Brand Assets)", section: "visibility", searchTerms: ["mental availability", "Byron Sharp brand salience", "category entry points"], quarter: 1 },
  { week: 2, topic: "System 1 vs System 2", sources: "Kahneman (Thinking Fast and Slow), Shotton (Choice Factory)", section: "behavioral_science", searchTerms: ["System 1 System 2", "Kahneman dual process", "automatic thinking"], quarter: 1 },
  { week: 3, topic: "Social Proof", sources: "Cialdini (Influence), Shotton (Choice Factory)", section: "behavioral_science", searchTerms: ["social proof Cialdini", "conformity influence", "herd behavior"], quarter: 1 },
  { week: 4, topic: "Loss Aversion", sources: "Kahneman (Thinking Fast and Slow), Thaler (Nudge)", section: "behavioral_science", searchTerms: ["loss aversion Kahneman", "prospect theory", "losses loom larger"], quarter: 1 },
  { week: 5, topic: "The Long and Short of It", sources: "Binet & Field (The Long and the Short of It)", section: "visibility", searchTerms: ["Binet Field long short", "brand building activation", "60 40 rule"], quarter: 1 },
  { week: 6, topic: "Anchoring Effect", sources: "Kahneman, Ariely (Predictably Irrational)", section: "behavioral_science", searchTerms: ["anchoring effect", "Ariely anchoring", "price anchoring"], quarter: 1 },
  { week: 7, topic: "SOV/SOM Relationship", sources: "Binet & Field, Sharp", section: "visibility", searchTerms: ["share of voice market", "excess share of voice", "SOV SOM"], quarter: 1 },
  { week: 8, topic: "Reciprocity Principle", sources: "Cialdini (Influence)", section: "behavioral_science", searchTerms: ["reciprocity Cialdini", "give and take", "obligation influence"], quarter: 1 },
  { week: 9, topic: "Choice Architecture", sources: "Thaler & Sunstein (Nudge)", section: "behavioral_science", searchTerms: ["choice architecture", "nudge theory", "default options"], quarter: 1 },
  { week: 10, topic: "Distinctive Brand Assets", sources: "Romaniuk (Building Distinctive Brand Assets)", section: "visibility", searchTerms: ["distinctive assets Romaniuk", "brand recognition", "visual identity"], quarter: 1 },
  { week: 11, topic: "Scarcity Principle", sources: "Cialdini (Influence), Shotton", section: "behavioral_science", searchTerms: ["scarcity principle", "Cialdini scarcity", "limited availability"], quarter: 1 },
  { week: 12, topic: "Mere Exposure Effect", sources: "Zajonc, Sharp", section: "behavioral_science", searchTerms: ["mere exposure effect", "familiarity preference", "repeated exposure"], quarter: 1 },
  { week: 13, topic: "Q1 Synthesis: The Science of Being Chosen", sources: "Multiple Q1 sources", section: "all", searchTerms: ["brand choice", "decision making", "consumer behavior"], quarter: 1 },
  
  // Q2: Applied Behavioral Marketing
  { week: 14, topic: "Pre-suasion", sources: "Cialdini (Pre-suasion)", section: "behavioral_science", searchTerms: ["pre-suasion Cialdini", "priming influence", "attention channeling"], quarter: 2 },
  { week: 15, topic: "Framing Effects", sources: "Kahneman, Thaler", section: "behavioral_science", searchTerms: ["framing effects", "Kahneman framing", "presentation bias"], quarter: 2 },
  { week: 16, topic: "The Attention Economy", sources: "Orlando Wood (Lemon, Look Out)", section: "attention", searchTerms: ["attention economy", "Orlando Wood", "right brain advertising"], quarter: 2 },
  { week: 17, topic: "Category Entry Points", sources: "Romaniuk (How Brands Grow Part 2)", section: "visibility", searchTerms: ["category entry points", "Romaniuk CEP", "buying situations"], quarter: 2 },
  { week: 18, topic: "The Messy Middle", sources: "Google Research, Shotton", section: "behavioral_science", searchTerms: ["messy middle", "Google consumer journey", "exploration evaluation"], quarter: 2 },
  { week: 19, topic: "Neuromarketing Fundamentals", sources: "Barden (Decoded)", section: "behavioral_science", searchTerms: ["neuromarketing", "Barden decoded", "implicit associations"], quarter: 2 },
  { week: 20, topic: "Commitment & Consistency", sources: "Cialdini (Influence)", section: "behavioral_science", searchTerms: ["commitment consistency", "Cialdini commitment", "foot in door"], quarter: 2 },
  { week: 21, topic: "The Fluency Heuristic", sources: "Kahneman, Alter", section: "behavioral_science", searchTerms: ["processing fluency", "cognitive ease", "fluency heuristic"], quarter: 2 },
  { week: 22, topic: "Emotional vs Rational Advertising", sources: "Binet & Field, Wood", section: "creativity", searchTerms: ["emotional advertising", "rational emotional", "advertising effectiveness"], quarter: 2 },
  { week: 23, topic: "Authority Principle", sources: "Cialdini (Influence)", section: "behavioral_science", searchTerms: ["authority principle Cialdini", "expert influence", "credibility"], quarter: 2 },
  { week: 24, topic: "The Peak-End Rule", sources: "Kahneman", section: "behavioral_science", searchTerms: ["peak end rule", "Kahneman memory", "experience evaluation"], quarter: 2 },
  { week: 25, topic: "Habit Formation", sources: "Wood (Good Habits Bad Habits), Duhigg", section: "behavioral_science", searchTerms: ["habit formation", "habit loop", "behavioral change"], quarter: 2 },
  { week: 26, topic: "Q2 Synthesis: Engineering Choice", sources: "Multiple Q2 sources", section: "all", searchTerms: ["choice engineering", "behavioral design", "decision architecture"], quarter: 2 },
  
  // Q3: Effectiveness & Measurement
  { week: 27, topic: "Brand Building ROI", sources: "Binet & Field (Effectiveness in Context)", section: "measurement_attribution", searchTerms: ["brand building ROI", "long term effectiveness", "brand metrics"], quarter: 3 },
  { week: 28, topic: "Mental Availability Metrics", sources: "Romaniuk, Sharp", section: "visibility", searchTerms: ["mental availability measurement", "brand salience metrics", "tracking awareness"], quarter: 3 },
  { week: 29, topic: "When Brands Go Dark", sources: "Ehrenberg-Bass research", section: "visibility", searchTerms: ["advertising hiatus", "brand decay", "going dark"], quarter: 3 },
  { week: 30, topic: "GEO: Generative Engine Optimization", sources: "GEO research papers", section: "visibility", searchTerms: ["generative engine optimization", "AI search visibility", "LLM ranking"], quarter: 3 },
  { week: 31, topic: "Share of Search", sources: "Les Binet, James Hankins", section: "visibility", searchTerms: ["share of search", "search demand", "brand interest"], quarter: 3 },
  { week: 32, topic: "The Attention Payoff", sources: "Lumen Research, Wood", section: "attention", searchTerms: ["attention metrics", "attention effectiveness", "viewability attention"], quarter: 3 },
  { week: 33, topic: "Double Jeopardy Law", sources: "Sharp (How Brands Grow)", section: "visibility", searchTerms: ["double jeopardy", "Sharp brand growth", "penetration loyalty"], quarter: 3 },
  { week: 34, topic: "Advertising Elasticity", sources: "Binet & Field, econometric studies", section: "measurement_attribution", searchTerms: ["advertising elasticity", "ad response", "diminishing returns"], quarter: 3 },
  { week: 35, topic: "The 95-5 Rule", sources: "Ehrenberg-Bass, LinkedIn B2B Institute", section: "visibility", searchTerms: ["95 5 rule", "out of market buyers", "B2B buying"], quarter: 3 },
  { week: 36, topic: "Reach vs Frequency", sources: "Sharp, Ephron", section: "media_strategy", searchTerms: ["reach frequency", "effective frequency", "media planning"], quarter: 3 },
  { week: 37, topic: "Marketing Effectiveness Crisis", sources: "IPA studies, Binet & Field", section: "measurement_attribution", searchTerms: ["effectiveness crisis", "short termism", "marketing effectiveness"], quarter: 3 },
  { week: 38, topic: "Attribution Reality", sources: "Various attribution studies", section: "measurement_attribution", searchTerms: ["attribution modeling", "marketing attribution", "incrementality"], quarter: 3 },
  { week: 39, topic: "Q3 Synthesis: Proving Marketing Works", sources: "Multiple Q3 sources", section: "all", searchTerms: ["marketing proof", "effectiveness evidence", "marketing measurement"], quarter: 3 },
  
  // Q4: Advanced Applications
  { week: 40, topic: "Alchemy: The Magic of Irrational", sources: "Rory Sutherland (Alchemy)", section: "behavioral_science", searchTerms: ["Sutherland alchemy", "irrational value", "psycho-logic"], quarter: 4 },
  { week: 41, topic: "Choice Overload", sources: "Schwartz (Paradox of Choice), Iyengar", section: "behavioral_science", searchTerms: ["choice overload", "paradox of choice", "decision fatigue"], quarter: 4 },
  { week: 42, topic: "Behavioral Biology", sources: "Sapolsky, evolutionary psychology", section: "behavioral_science", searchTerms: ["behavioral biology", "evolutionary psychology", "innate behavior"], quarter: 4 },
  { week: 43, topic: "AI Disclosure Effects", sources: "Recent research on AI labeling", section: "visibility", searchTerms: ["AI disclosure", "AI labeling", "algorithm aversion"], quarter: 4 },
  { week: 44, topic: "Scientific Advertising Redux", sources: "Hopkins (Scientific Advertising), modern applications", section: "creativity", searchTerms: ["scientific advertising", "Hopkins advertising", "evidence based creative"], quarter: 4 },
  { week: 45, topic: "Unity Principle", sources: "Cialdini (Pre-suasion)", section: "behavioral_science", searchTerms: ["unity principle", "Cialdini unity", "shared identity"], quarter: 4 },
  { week: 46, topic: "Behavioral Pricing", sources: "Ariely, Thaler", section: "behavioral_science", searchTerms: ["behavioral pricing", "price psychology", "decoy effect"], quarter: 4 },
  { week: 47, topic: "The Liking Principle", sources: "Cialdini (Influence)", section: "behavioral_science", searchTerms: ["liking principle", "Cialdini liking", "similarity attraction"], quarter: 4 },
  { week: 48, topic: "Cognitive Load Theory", sources: "Sweller, UX research", section: "attention", searchTerms: ["cognitive load", "mental effort", "information processing"], quarter: 4 },
  { week: 49, topic: "Availability Heuristic", sources: "Kahneman, Tversky", section: "behavioral_science", searchTerms: ["availability heuristic", "Kahneman availability", "ease of recall"], quarter: 4 },
  { week: 50, topic: "Status Quo Bias", sources: "Kahneman, Thaler", section: "behavioral_science", searchTerms: ["status quo bias", "default effect", "inertia"], quarter: 4 },
  { week: 51, topic: "The IKEA Effect", sources: "Norton, Ariely", section: "behavioral_science", searchTerms: ["IKEA effect", "effort justification", "labor love"], quarter: 4 },
  { week: 52, topic: "Annual Synthesis: The Behavioral Marketing Framework", sources: "All 52 weeks", section: "all", searchTerms: ["behavioral marketing", "evidence based marketing", "marketing psychology"], quarter: 4 },
];

// Get current week number of the year
export function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

// Get week data by week number
export function getWeekData(weekNum) {
  return WEEKLY_CALENDAR.find(w => w.week === weekNum) || WEEKLY_CALENDAR[0];
}
