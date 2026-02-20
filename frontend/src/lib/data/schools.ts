/**
 * Static dataset of US universities for the school dropdown.
 *
 * Why static instead of a backend API?
 * - No database table needed — simpler architecture
 * - Zero network latency — the list is bundled with the frontend
 * - Easy to expand later — just add more entries to this array
 *
 * The user's selected school is stored as a free-text string
 * (school_name column in app_user). This means:
 * 1. It's not a foreign key — no referential integrity
 * 2. Users could theoretically type a school not in this list
 *    (but the UI uses a dropdown, so they pick from here)
 *
 * Sorted alphabetically for the dropdown display.
 */
export const schools: string[] = [
  "Arizona State University",
  "Boston University",
  "California Institute of Technology",
  "Carnegie Mellon University",
  "Columbia University",
  "Cornell University",
  "Duke University",
  "Georgia Institute of Technology",
  "Harvard University",
  "Johns Hopkins University",
  "Massachusetts Institute of Technology",
  "New York University",
  "Northwestern University",
  "Ohio State University",
  "Princeton University",
  "Purdue University",
  "Rice University",
  "Stanford University",
  "University of California, Berkeley",
  "University of California, Los Angeles",
  "University of California, San Diego",
  "University of Illinois Urbana-Champaign",
  "University of Maryland",
  "University of Michigan",
  "University of Pennsylvania",
  "University of Southern California",
  "University of Texas at Austin",
  "University of Washington",
  "University of Wisconsin-Madison",
  "Virginia Tech",
];
