import { Component, HostBinding, OnDestroy, Signal, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../shell/theme.service';
import {
  CREATE_FINAL_DELAY_MS,
  CREATE_STAGES,
  CREATE_STAGE_DELAY_MS,
  type CashEntry,
  type CreateIssue,
  type FormState,
  createIssues,
  createSummaryRows,
} from './comptes-form';

export interface AcCreateDialogData {
  readonly form: Signal<FormState>;
  readonly cash: Signal<readonly CashEntry[]>;
}

export type AcCreateDialogResult = 'ok' | 'cancelled';

type CreatePhase = 'busy' | 'ok' | 'fail';

/**
 * Modale de progression « Créer le compte » (`createOpen`/`runCreate()` du prototype, lignes
 * 834-916 et 1651-1679) — un `MatDialog` centré classique (pas un panneau latéral) : spinner +
 * barre de progression animée à texte d'étape variable, puis état de réussite (récapitulatif)
 * ou d'échec (liste d'anomalies, avec reprise via « Relancer »).
 *
 * N'apparaît que pour l'opération de création : `opNext()` du prototype n'appelle `runCreate()`
 * que lorsque `this.state.op === 'create'` sur la dernière étape ; Modification et Clôture se
 * contentent d'un message de statut inline, sans modale — reproduit à l'identique dans
 * `Comptes.opNext()`.
 */
@Component({
  selector: 'app-ac-create-dialog',
  imports: [MatIconModule, MatDialogModule, MatButtonModule],
  templateUrl: './ac-create-dialog.html',
  styleUrl: './ac-create-dialog.css',
})
export class AcCreateDialog implements OnDestroy {
  private readonly data = inject<AcCreateDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AcCreateDialog, AcCreateDialogResult>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly phase = signal<CreatePhase>('busy');
  protected readonly stage = signal(CREATE_STAGES[0]);
  protected readonly errors = signal<readonly CreateIssue[]>([]);

  protected readonly title = computed(() => (this.phase() === 'busy' ? 'Création du compte en cours' : this.phase() === 'ok' ? 'Compte ouvert' : 'Création du compte'));
  protected readonly failNote = computed(() => {
    const n = this.errors().length;
    return n + (n > 1 ? ' anomalies bloquent l\'enregistrement.' : ' anomalie bloque l\'enregistrement.');
  });
  protected readonly rows = computed(() => createSummaryRows(this.data.form(), this.data.cash()));

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    this.run();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  protected run(): void {
    this.clearTimers();
    this.phase.set('busy');
    this.stage.set(CREATE_STAGES[0]);
    this.errors.set([]);
    CREATE_STAGES.slice(1).forEach((label, i) => {
      this.timers.push(setTimeout(() => this.stage.set(label), CREATE_STAGE_DELAY_MS * (i + 1)));
    });
    this.timers.push(
      setTimeout(() => {
        const issues = createIssues(this.data.form(), this.data.cash());
        if (issues.length) {
          this.phase.set('fail');
          this.errors.set(issues);
        } else {
          this.phase.set('ok');
          this.errors.set([]);
        }
      }, CREATE_FINAL_DELAY_MS),
    );
  }

  protected retry(): void {
    this.run();
  }

  protected closeDialog(): void {
    this.dialogRef.close(this.phase() === 'ok' ? 'ok' : 'cancelled');
  }
}
