import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Question } from '../models/question.model';
import { Answer } from '../models/answer.model';
import { BehaviorSubject, switchMap, tap } from 'rxjs';
import { ExamGeneratorService } from './exam-generator.service';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  readonly examGeneratorService = inject(ExamGeneratorService);

  readonly #generateExam$ = new BehaviorSubject<number>(1);

  readonly #questions = signal<Question[]>([
    {
      caption: 'How much is 4 + 4',
      answers: ['4', '8', '12', '16'],
      correctAnswerIndex: 1,
    },
    {
      caption: 'How much is 5 + 5',
      answers: ['15', '20', '13', '10'],
      correctAnswerIndex: 3,
    },
    {
      caption: 'How much is 6 + 6',
      answers: ['6', '8', '12', '18'],
      correctAnswerIndex: 2,
    },
  ]);
  readonly #userAnswers = signal<number[]>([]);
  readonly #isBusy = signal<boolean>(false);
  readonly currentQuestionIndex = computed(() => this.#userAnswers().length);
  readonly currentQuestion = computed(
    () => this.#questions()[this.currentQuestionIndex()]
  );
  readonly questionsCount = computed(() => this.#questions().length);
  readonly userAnswers = computed(() =>
    this.#userAnswers().map<Answer>((answer, index) => ({
      userAnswerIndex: answer,
      isCorrect: answer === this.#questions()[index].correctAnswerIndex,
    }))
  );
  readonly isQuizDone = computed(
    () => this.currentQuestionIndex() === this.questionsCount()
  );
  readonly correctAnswers = computed(() =>
    this.userAnswers().filter((answer) => answer.isCorrect)
  );
  readonly correctAnswersCount = computed(() => this.correctAnswers().length);
  readonly questions = this.#questions.asReadonly();
  readonly isBusy = this.#isBusy.asReadonly();
  readonly level = toSignal(this.#generateExam$);

  constructor() {
    this.#generateExam$.pipe(
      tap(() => this.#isBusy.set(true)),
      switchMap((level) => this.examGeneratorService.generateExam(level)),
      tap((questions) => {
        this.#questions.set(questions);
        this.#userAnswers.set([]);
        this.#isBusy.set(false);
      })
    ).subscribe();
  }

  answerCurrentQuestion(index: number): void {
    this.#userAnswers.update((answers) => [...answers, index]);
  }

  increaseLevel() {
    this.#generateExam$.next(this.#generateExam$.value + 1);
  }

  decreaseLevel() {
    if (this.#generateExam$.value > 1) {
      this.#generateExam$.next(this.#generateExam$.value - 1);
    } else {
      this.repeatLevel()
    } 
  }

  repeatLevel() {
    this.#generateExam$.next(this.#generateExam$.value);
  }
}
