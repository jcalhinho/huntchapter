import { z } from 'zod';

// Schema for the prologue generation
export const PrologueSchema = z.object({
  narration: z.string().min(10, "La narration doit être plus détaillée."),
});

// Schema for a standard game scene
export const SceneSchema = z.object({
  narration: z.string().min(10, "La narration doit être plus détaillée."),
  options: z.array(z.string()).length(3, "Il doit y avoir exactement 3 options."),
});

// Schema for a challenge scene
export const ChallengeSchema = z.object({
    narration: z.string().min(10, "La narration doit être plus détaillée."),
    challenge: z.object({
        question: z.string().min(5),
        choices: z.array(z.string()).min(2).max(4),
    }),
});

// Schema for an ending scene
export const EndingSchema = z.object({
    narration: z.string().min(10, "La narration doit être plus détaillée."),
    endingTitle: z.string().min(3),
    status: z.enum(['win', 'loss']),
});

// A comprehensive schema that can validate any type of scene returned by the AI
export const AnySceneSchema = z.union([
    SceneSchema,
    ChallengeSchema,
    EndingSchema
]);
