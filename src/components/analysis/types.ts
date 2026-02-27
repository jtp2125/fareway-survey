// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Respondent = Record<string, any>;

export interface QuestionFilter {
  id: string;
  values: string[];
  operator: string;
  numVal: string;
  numVal2: string;
  binaryVal: string | null;
}
