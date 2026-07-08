import type { Step } from "@/lib/constants";

export interface SessionRow {
  id: string;
  name: string;
  created_at: string;
  current_step: Step;
  checkin_anonymous: boolean;
  action_plan_anonymous: boolean;
  is_active: boolean;
}

export interface MemberRow {
  id: string;
  session_id: string;
  display_name: string | null;
  character: string | null;
  joined_at: string;
}

export interface IcebreakerChapterRow {
  id: string;
  session_id: string;
  member_id: string;
  chapter_name: string;
  created_at: string;
}

export interface IcebreakerVoteRow {
  id: string;
  chapter_id: string;
  member_id: string;
  created_at: string;
}

export interface ChapterWithVotes extends IcebreakerChapterRow {
  votes: number;
  votedByMe: boolean;
}

export interface CheckinPlacementRow {
  id: string;
  session_id: string;
  member_id: string;
  emotion_zone: number;
  created_at: string;
}

export interface RetroItemRow {
  id: string;
  session_id: string;
  member_id: string;
  column_type: "good" | "bad" | "improve";
  content: string;
  created_at: string;
}

export interface ActionItemRow {
  id: string;
  session_id: string;
  member_id: string;
  content: string;
  selected: boolean;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
}
