export type Grade = "A" | "B" | "C";

export type ScoringInput = {
  plotAreaM2: number | null;
  houseAreaM2: number | null;
  vegetationFeatureCount: number;
  hasPool: boolean;
  slopePercent: number | null;
};

export type FactorScore = {
  grade: Grade;
  label: string;
};

export type ScoringResult = {
  grade: Grade;
  reason: string;
  backyardM2: number;
  factors: {
    space: FactorScore;
    vegetation: FactorScore;
    terrain: FactorScore;
    access: FactorScore;
    pool: { detected: boolean; label: string | null };
  };
};

const GRADE_VALUE: Record<Grade, number> = { A: 3, B: 2, C: 1 };

export function estimateBackyardM2(
  plotAreaM2: number | null,
  houseAreaM2: number | null,
): number {
  if (plotAreaM2 === null || plotAreaM2 <= 0) {
    return 0;
  }

  if (houseAreaM2 === null || houseAreaM2 <= 0) {
    return plotAreaM2 * 0.65;
  }

  return Math.max(0, plotAreaM2 - houseAreaM2);
}

export function scoreSpace(backyardM2: number): FactorScore {
  if (backyardM2 >= 600) {
    return { grade: "A", label: "Large backyard" };
  }

  if (backyardM2 >= 150) {
    return { grade: "B", label: "Good space" };
  }

  return { grade: "C", label: "Very little space" };
}

export function scoreVegetation(featureCount: number): FactorScore {
  if (featureCount <= 2) {
    return { grade: "A", label: "Few trees" };
  }

  if (featureCount <= 8) {
    return { grade: "B", label: "Some vegetation" };
  }

  return { grade: "C", label: "Heavy vegetation" };
}

export function scoreTerrain(slopePercent: number | null): FactorScore {
  if (slopePercent === null) {
    return { grade: "B", label: "Minor obstacles" };
  }

  if (slopePercent <= 5) {
    return { grade: "A", label: "Flat terrain" };
  }

  if (slopePercent <= 12) {
    return { grade: "B", label: "Minor obstacles" };
  }

  return { grade: "C", label: "Steep terrain" };
}

export function scoreAccess(
  backyardM2: number,
  plotAreaM2: number | null,
  houseAreaM2: number | null,
): FactorScore {
  if (plotAreaM2 === null || plotAreaM2 <= 0) {
    return { grade: "B", label: "Minor obstacles" };
  }

  const houseArea = houseAreaM2 ?? plotAreaM2 * 0.25;
  const coverage = houseArea / plotAreaM2;

  if (coverage <= 0.25 && backyardM2 >= 200) {
    return { grade: "A", label: "Easy access from house" };
  }

  if (coverage <= 0.45) {
    return { grade: "B", label: "Minor obstacles" };
  }

  return { grade: "C", label: "Minor obstacles" };
}

function averageGrade(grades: Grade[]): Grade {
  const average =
    grades.reduce((sum, grade) => sum + GRADE_VALUE[grade], 0) / grades.length;

  if (average >= 2.5) {
    return "A";
  }

  if (average >= 1.75) {
    return "B";
  }

  return "C";
}

function buildReason(
  grade: Grade,
  factors: ScoringResult["factors"],
): string {
  const labels = [
    factors.space.label,
    factors.vegetation.label,
    factors.terrain.label,
    factors.access.label,
  ];

  if (factors.pool.detected && factors.pool.label) {
    labels.push(factors.pool.label);
  }

  const matching = labels.filter((label) => {
    if (grade === "A") {
      return [
        "Large backyard",
        "Few trees",
        "Flat terrain",
        "Easy access from house",
      ].includes(label);
    }

    if (grade === "B") {
      return ["Good space", "Some vegetation", "Minor obstacles"].includes(
        label,
      );
    }

    return [
      "Very little space",
      "Heavy vegetation",
      "Steep terrain",
      "Pool occupies area",
    ].includes(label);
  });

  const unique = [...new Set(matching.length > 0 ? matching : labels)];
  return unique.slice(0, 4).join("; ");
}

export function scoreParcel(input: ScoringInput): ScoringResult {
  const backyardM2 = estimateBackyardM2(input.plotAreaM2, input.houseAreaM2);

  const space = scoreSpace(backyardM2);
  const vegetation = scoreVegetation(input.vegetationFeatureCount);
  const terrain = scoreTerrain(input.slopePercent);
  const access = scoreAccess(
    backyardM2,
    input.plotAreaM2,
    input.houseAreaM2,
  );

  const pool = {
    detected: input.hasPool,
    label: input.hasPool ? "Pool occupies area" : null,
  };

  const factorGrades = [space.grade, vegetation.grade, terrain.grade, access.grade];

  let grade: Grade;
  if (input.hasPool) {
    grade = "C";
  } else if (factorGrades.filter((g) => g === "C").length >= 2) {
    grade = "C";
  } else if (
    factorGrades.filter((g) => g === "A").length >= 3 &&
    !factorGrades.includes("C")
  ) {
    grade = "A";
  } else {
    grade = averageGrade(factorGrades);
  }

  const factors = { space, vegetation, terrain, access, pool };

  return {
    grade,
    reason: buildReason(grade, factors),
    backyardM2,
    factors,
  };
}
