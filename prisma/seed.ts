import { PrismaClient, ComponentStatus, AlertSeverity, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Mod = {
  name: string;
  semester: "S5" | "S6" | "S7" | "S8" | "S9";
  c: number;
  td: number;
  tp: number;
};

// Hours derived from VHS (14-16 weeks): 1H30/week ≈ 21h, 3H/week ≈ 42h.
// The c/td/tp triplet sums to the module's VHS.
const CURRICULUM: Mod[] = [
  // ---------- Semester 5 (L3) ----------
  { name: "Architecture et administration des BDD", semester: "S5", c: 21, td: 21, tp: 0 },
  { name: "Compilation", semester: "S5", c: 21, td: 21, tp: 21 },
  { name: "Programmation Linéaire et Dynamique", semester: "S5", c: 21, td: 21, tp: 0 },
  { name: "Analyse numérique 1", semester: "S5", c: 21, td: 21, tp: 21 },
  { name: "Génie logiciel", semester: "S5", c: 21, td: 21, tp: 21 },
  { name: "Fondements de l'IA", semester: "S5", c: 21, td: 21, tp: 0 },
  { name: "Développement mobile", semester: "S5", c: 21, td: 0, tp: 21 },

  // ---------- Semester 6 (L3) ----------
  { name: "Gestion des bases de données réparties", semester: "S6", c: 21, td: 0, tp: 21 },
  { name: "Système d'Exploitation : Synchronisation et Communication", semester: "S6", c: 42, td: 21, tp: 21 },
  { name: "Gestion de projets", semester: "S6", c: 21, td: 21, tp: 21 },
  { name: "Programmation WEB", semester: "S6", c: 21, td: 0, tp: 21 },
  { name: "Analyse numérique 2", semester: "S6", c: 21, td: 21, tp: 21 },
  { name: "Introduction à la sécurité Informatique", semester: "S6", c: 21, td: 21, tp: 21 },

  // ---------- Semester 7 (M1) ----------
  { name: "Représentation des connaissances et raisonnement", semester: "S7", c: 21, td: 21, tp: 21 },
  { name: "Calcul haute performance", semester: "S7", c: 21, td: 21, tp: 21 },
  { name: "Machine Learning", semester: "S7", c: 42, td: 0, tp: 21 },
  { name: "Modélisation et simulation", semester: "S7", c: 21, td: 21, tp: 21 },
  { name: "Business Intelligence", semester: "S7", c: 21, td: 0, tp: 21 },
  { name: "Recherche opérationnelle", semester: "S7", c: 21, td: 21, tp: 0 },
  { name: "Techniques de rédaction", semester: "S7", c: 21, td: 0, tp: 21 },

  // ---------- Semester 8 (M1) ----------
  { name: "Sécurité des données", semester: "S8", c: 21, td: 21, tp: 21 },
  { name: "Deep learning", semester: "S8", c: 42, td: 0, tp: 21 },
  { name: "Traitement Automatique du Langage Naturel", semester: "S8", c: 21, td: 0, tp: 21 },
  { name: "Traitement de données massives", semester: "S8", c: 21, td: 0, tp: 21 },
  { name: "Technologies de Calcul Distribué et IA", semester: "S8", c: 21, td: 0, tp: 21 },
  { name: "Analyse et Traitement d'image", semester: "S8", c: 21, td: 0, tp: 21 },
  { name: "Projet pluridisciplinaire", semester: "S8", c: 0, td: 0, tp: 42 },

  // ---------- Semester 9 (M2) ----------
  { name: "Visualisation de données", semester: "S9", c: 21, td: 0, tp: 21 },
  { name: "Vision par ordinateur", semester: "S9", c: 21, td: 0, tp: 21 },
  { name: "Generative AI", semester: "S9", c: 21, td: 0, tp: 21 },
  { name: "Méthodes bio-inspirées", semester: "S9", c: 21, td: 0, tp: 21 },
  { name: "Architectures et technologies blockchain", semester: "S9", c: 21, td: 0, tp: 21 },
  { name: "Recherche d'information", semester: "S9", c: 21, td: 0, tp: 21 },
  { name: "Séminaire & workshops", semester: "S9", c: 21, td: 0, tp: 0 },
];

// 15 professors — each will be assigned 2-3 modules spanning different semesters.
const PROFESSORS = [
  { first: "Karim",   last: "Amrani"   },
  { first: "Sara",    last: "Belhadj"  },
  { first: "Mohamed", last: "Cherif"   },
  { first: "Nadia",   last: "Djabri"   },
  { first: "Omar",    last: "Essaid"   },
  { first: "Leila",   last: "Ferhat"   },
  { first: "Rachid",  last: "Ghanem"   },
  { first: "Fatima",  last: "Hadj"     },
  { first: "Youcef",  last: "Idris"    },
  { first: "Amina",   last: "Jaafer"   },
  { first: "Hichem",  last: "Kader"    },
  { first: "Meriem",  last: "Larbi"    },
  { first: "Djamel",  last: "Mansouri" },
  { first: "Souad",   last: "Nouri"    },
  { first: "Tarek",   last: "Oulhadj"  },
];

const ACADEMIC_YEAR = "2025-2026";

function semesterToYearLabel(s: Mod["semester"]) {
  if (s === "S5" || s === "S6") return `L3 (${ACADEMIC_YEAR}) - ${s}`;
  if (s === "S7" || s === "S8") return `M1 (${ACADEMIC_YEAR}) - ${s}`;
  return `M2 (${ACADEMIC_YEAR}) - ${s}`;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`Database already has ${existing} users — skipping seed. (Set FORCE_SEED=true to wipe and re-seed.)`);
    return;
  }

  console.log("Seeding curriculum...");

  await prisma.reportModule.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.progressLog.deleteMany();
  await prisma.moduleComponent.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@univ.edu", password, role: Role.admin },
  });
  const committee = await prisma.user.create({
    data: { name: "Pedagogical Committee", email: "committee@univ.edu", password, role: Role.committee },
  });

  // Create 15 professors — each ends up teaching 2-3 modules.
  const professors = await Promise.all(
    PROFESSORS.map(({ first, last }) =>
      prisma.user.create({
        data: {
          name: `${first} ${last}`,
          email: `${last.toLowerCase()}@univ.edu`,
          password,
          role: Role.professor,
        },
      })
    )
  );

  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 8, 1); // Sept 1

  // Track which modules each professor teaches for the summary log.
  const profModules: Record<string, string[]> = {};
  for (const p of professors) profModules[p.email] = [];

  for (let i = 0; i < CURRICULUM.length; i++) {
    const m = CURRICULUM[i];
    // Distribute modules evenly across professors (gives 2-3 each).
    const professor = professors[Math.floor(i * PROFESSORS.length / CURRICULUM.length)];
    profModules[professor.email].push(m.name);

    const isDelayed = i % 8 === 0; // ~12% delayed
    const mod = await prisma.module.create({
      data: {
        name: m.name,
        academicYear: semesterToYearLabel(m.semester),
        professorId: professor.id,
      },
    });

    const triplets: Array<["C" | "TD" | "TP", number]> = [
      ["C", m.c],
      ["TD", m.td],
      ["TP", m.tp],
    ];

    for (const [type, planned] of triplets) {
      if (planned === 0) continue;

      let completed: number;
      let status: ComponentStatus;
      let endDate: Date;

      if (isDelayed) {
        completed = rand(2, Math.max(2, Math.floor(planned * 0.5)));
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() - rand(5, 20));
        status = ComponentStatus.delayed;
      } else {
        completed = rand(Math.floor(planned * 0.3), planned);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + rand(10, 60));
        status =
          completed >= planned
            ? ComponentStatus.completed
            : completed === 0
            ? ComponentStatus.not_started
            : ComponentStatus.in_progress;
      }

      const comp = await prisma.moduleComponent.create({
        data: {
          moduleId: mod.id,
          type,
          plannedHours: planned,
          completedHours: completed,
          startDate: yearStart,
          endDate,
          status,
        },
      });

      const logs = rand(2, 4);
      let remaining = completed;
      for (let l = 0; l < logs && remaining > 0; l++) {
        const h = l === logs - 1 ? remaining : rand(1, Math.max(1, Math.floor(remaining / 2)));
        await prisma.progressLog.create({ data: { componentId: comp.id, hoursAdded: h } });
        remaining -= h;
      }
    }

    if (isDelayed) {
      await prisma.alert.create({
        data: {
          moduleId: mod.id,
          message: `Module "${mod.name}" is behind schedule.`,
          severity: AlertSeverity.critical,
        },
      });
    }
  }

  const modules = await prisma.module.findMany();
  const r1 = await prisma.report.create({
    data: {
      title: "Mid-Semester Pedagogical Committee Meeting",
      content:
        "Reviewed progress across all semesters. Discussed delays and corrective actions.",
      meetingDate: new Date(),
    },
  });
  for (const m of modules.slice(0, 8)) {
    await prisma.reportModule.create({ data: { reportId: r1.id, moduleId: m.id } });
  }

  await prisma.notification.create({
    data: { userId: admin.id, message: "New academic year configured.", isRead: false },
  });
  await prisma.notification.create({
    data: { userId: committee.id, message: "Initial pedagogical report available.", isRead: false },
  });

  console.log(`\nSeed complete. ${CURRICULUM.length} modules across S5-S9.`);
  console.log("All accounts use password: password123\n");
  console.log("System accounts:");
  console.log("  admin@univ.edu       (admin)");
  console.log("  committee@univ.edu   (committee)\n");
  console.log("Professors (each teaches 2-3 modules):");
  for (const p of professors) {
    const mods = profModules[p.email];
    console.log(`  ${p.email.padEnd(28)} → ${mods.join(" | ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
