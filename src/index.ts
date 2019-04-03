import { Observable, timer, Subject, BehaviorSubject, zip } from 'rxjs';
import { take, mapTo, finalize, exhaustMap, filter } from 'rxjs/operators';

export class QueueScheduler {
  private queue$: BehaviorSubject<any> = new BehaviorSubject(null);
  private tasks$: Subject<any> = new Subject();
  private compliteTask$: Subject<any> = new Subject();
  private isFirst: boolean = true;

  constructor() {
    zip(this.tasks$, this.compliteTask$)
      .subscribe(nextTask => {
        this.queue$.next(nextTask[0]);
      })
  }

  public performTask<T>(obs: Observable<T>): Observable<T> {
    if (this.isFirst) {
      this.compliteTask$.next();
      this.isFirst = false;
    }

    this.addTaskInQueue<T>(obs);
    return this.getTask<T>(obs);
  }

  private addTaskInQueue<T>(obs: Observable<T>): void {
    this.tasks$.next(obs);
  }

  private getTask<T>(obs: Observable<T>): Observable<T> {
    return this.queue$
      .pipe(
        filter(task => task === obs),
        exhaustMap((task: Observable<T>) => task.pipe(
          finalize(() => this.compliteTask$.next()),
        ))
      )
  }
}

const generateTasks = (count: number = 10) => {
  const callback = (data: any) => console.log(data);

  const o = new QueueScheduler();
  for (let i = 0; i < count; i++) {
    const obs: Observable<number> = timer(0, 500).pipe(take(5), mapTo(i));
    o.performTask<number>(obs).subscribe(callback);
  }
}

generateTasks(5);