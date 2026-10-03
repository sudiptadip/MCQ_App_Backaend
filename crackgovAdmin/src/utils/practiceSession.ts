import type { PracticeSession } from '../types/practice';

const KEY = (testId: number) => `practice_session_${testId}`;

export const practiceSession = {
  get(testId: number): PracticeSession | null {
    try {
      const raw = localStorage.getItem(KEY(testId));
      return raw ? (JSON.parse(raw) as PracticeSession) : null;
    } catch {
      return null;
    }
  },

  save(session: PracticeSession): void {
    try {
      localStorage.setItem(KEY(session.testId), JSON.stringify(session));
    } catch {
      // localStorage quota exceeded — silently ignore
    }
  },

  setAnswer(testId: number, questionId: number, optionId: number): void {
    const session = practiceSession.get(testId);
    if (!session) return;
    session.answers[questionId] = optionId;
    practiceSession.save(session);
  },

  toggleFlag(testId: number, questionId: number): void {
    const session = practiceSession.get(testId);
    if (!session) return;
    const idx = session.flagged.indexOf(questionId);
    if (idx === -1) session.flagged.push(questionId);
    else session.flagged.splice(idx, 1);
    practiceSession.save(session);
  },

  setAttemptId(testId: number, attemptId: number): void {
    const session = practiceSession.get(testId);
    if (!session) return;
    session.attemptId = attemptId;
    practiceSession.save(session);
  },

  complete(testId: number): void {
    const session = practiceSession.get(testId);
    if (!session) return;
    session.completed = true;
    practiceSession.save(session);
  },

  clear(testId: number): void {
    localStorage.removeItem(KEY(testId));
  },

  create(
    testId: number,
    testName: string,
    totalQuestions: number,
    durationMinutes: number,
  ): PracticeSession {
    const session: PracticeSession = {
      testId,
      testName,
      totalQuestions,
      durationMinutes,
      attemptId: null,
      startedAt: new Date().toISOString(),
      answers: {},
      flagged: [],
      completed: false,
    };
    practiceSession.save(session);
    return session;
  },
};
