import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/let';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/scan';
import 'rxjs/add/observable/throw';

import { ToastsManager } from 'ng2-toastr/ng2-toastr';

import { Store } from '@ngrx/store';
//import * as uiActions from '../../core/store/actions/ui.actions';
import * as fromRoot from '../../core/store/reducers';

import { environment } from '../../../environments/environment';

@Injectable()
export abstract class RestService {
  private amiUrl = environment.api;
  private maxRetryAttempts = 3;
  private headers: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${environment.accessToken}`);

  constructor (
    private http: HttpClient,
    private store: Store<fromRoot.State>,
    private toastr: ToastsManager ) { }

  protected get(url: string) {
    return this.http.get(this.amiUrl + url, { headers: this.headers })
      .let(this.handleRetry);
  }

  protected post(url: string, payload: any) {
    return this.http.post(this.amiUrl + url, payload, { headers: this.headers })
      .let(this.handleRetry);
  }

  protected delete(url: string) {
    return this.http.delete(this.amiUrl + url, { headers: this.headers })
      .let(this.handleRetry);
  } 

  private handleRetry= <T>(source: Observable<T>): Observable<T> => { 
    return source.retryWhen(e => 
      e.scan((errorCount, error) => {
        if (errorCount >= this.maxRetryAttempts) {
          //this.store.dispatch(new uiActions.ClearRetryNotificationAction);
          throw error;
        } else {
          //this.store.dispatch(new uiActions.CreateRetryNotificationAction({ attempt: errorCount + 1, maxAttempts: this.maxRetryAttempts }))
          return errorCount + 1;
        }
      }, 0)
      .delay(2000))
  }

  protected handleError(err: HttpErrorResponse, customMessage?: string) {
   // this.store.dispatch(new uiActions.CreateErrorNotificationAction(customMessage));

    console.log(err.error);
    console.log(err.status);
    console.log(err.name);
    console.log(err.message);

    if (!environment.production) {
      this.toastr.error(customMessage);
    }

    return Observable.throw(err.message);
  }
}
