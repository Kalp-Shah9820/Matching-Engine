export interface JobDescription {
  jd_id:          string;
  title:          string;
  company:        string | null;
  required_skills:string | null;
  location:       string | null;
  employment_type:string | null;
  created_at:     string | null;
}

export interface MatchSummary {
  rank:          number;
  candidate_id:  string;
  name:          string | null;
  current_title: string | null;
  location:      string | null;
  score:         number;
  score_percent: string;
  explanation:   string;
}

export interface MatchDetail extends MatchSummary {
  jd_id:               string;
  years_of_experience: number | null;
  skills_matched:      string[];
  skills_missing:      string[];
  experience_note:     string;
  education_note:      string;
  company_context:     string;
}

export interface UploadResponse {
  message: string;
  count:   number;
  ids:     string[] | null;
}
