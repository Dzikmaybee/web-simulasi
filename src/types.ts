/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Jenjang = "SMP" | "SMA" | "Kuliah";

export interface UserFormData {
  jenjang: Jenjang | null;
  skills: string[];
  minat: string[];
  cvImgBase64: string | null;
  cvImgMime: string | null;
  cvImgName: string | null;
  portfolioName: string | null;
}

export interface CareerMilestone {
  year: number;
  title: string;
  description: string;
  status: string;
}

export interface RequiredSkill {
  name: string;
  importance: number; // 1-5
  difficulty: string; // 'Mudah' | 'Sedang' | 'Sulit'
  source: string;
}

export interface RoadmapPhase {
  phase: string;
  duration: string;
  milestones: string[];
}

export interface SimulatorResponse {
  careerTitle: string;
  careerConcept: string;
  compatibilityRate: number;
  successProbability: number;
  summary: string;
  yearsTimeline: CareerMilestone[];
  requiredSkills: RequiredSkill[];
  roadmap: RoadmapPhase[];
  lifeSimulation: string;
  actionableNextSteps: string[];
}
