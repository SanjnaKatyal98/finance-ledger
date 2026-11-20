import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Combinator, Condition, Operator, Rule, RuleField, Severity } from '../../core/models';
import { RULES_KEY, RuleStore } from '../../core/rule.store';
import { StorageRepository } from '../../core/storage.service';
import { HasUnsavedChanges } from './unsaved-changes.guard';
import { noDuplicateConditions, uniqueRuleName } from './rule.validators';

type ConditionGroup = FormGroup<{
  field: FormControl<RuleField>;
  operator: FormControl<Operator>;
  value: FormControl<string>;
}>;

@Component({
  selector: 'app-rules',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ editingId() ? 'Edit rule' : 'New rule' }}</h2>

    <form [formGroup]="form" (ngSubmit)="save()" class="rule-form">
      <label>Rule name
        <span class="field">
          <input formControlName="name" />
          @if (nameStatus() === 'PENDING') { <span class="spinner" aria-label="Checking name"></span> }
        </span>
      </label>
      @if (form.controls.name.touched && form.controls.name.hasError('required') && nameStatus() !== 'PENDING') {
        <p class="err">Name is required.</p>
      }
      @if (nameStatus() === 'INVALID' && form.controls.name.hasError('nameTaken')) {
        <p class="err">A rule with this name already exists.</p>
      }

      <label>Severity
        <select formControlName="severity"><option>Warning</option><option>Blocker</option></select>
      </label>
      <label>Match
        <select formControlName="combinator">
          <option value="AND">ALL conditions (AND)</option>
          <option value="OR">ANY condition (OR)</option>
        </select>
      </label>

      <fieldset formArrayName="conditions">
        <legend>Conditions</legend>
        @for (c of conditions.controls; track c; let i = $index) {
          <div [formGroupName]="i" class="cond">
            <select formControlName="field">
              <option value="amount">Amount</option>
              <option value="merchant">Merchant</option>
              <option value="category">Category</option>
              <option value="weekend">Weekend Transaction</option>
            </select>
            <select formControlName="operator">
              <option value=">">&gt;</option><option value="<">&lt;</option>
              <option value="contains">contains</option><option value="equals">equals</option>
            </select>
            @if (c.controls.field.value === 'weekend') {
              <select formControlName="value"><option value="true">true</option><option value="false">false</option></select>
            } @else {
              <input formControlName="value" placeholder="Value" />
            }
            <button type="button" (click)="removeCondition(i)" [disabled]="conditions.length === 1">✕</button>
          </div>
        }
        @if (hasDuplicate()) { <p class="err">Each Field + Operator pair may only be used once per rule.</p> }
        <button type="button" (click)="addCondition()">+ Add condition</button>
      </fieldset>

      <button type="submit" [disabled]="formStatus() !== 'VALID'">Save rule</button>
      @if (editingId()) { <button type="button" (click)="cancelEdit()">Cancel edit</button> }
    </form>

    <h3>Saved rules</h3>
    <ul>
      @for (r of ruleStore.rules(); track r.id) {
        <li>
          <strong>{{ r.name }}</strong> — {{ r.severity }}, {{ r.combinator === 'AND' ? 'ALL' : 'ANY' }} of
          {{ r.conditions.length }} condition(s)
          <button type="button" (click)="edit(r)">Edit</button>
          <button type="button" (click)="ruleStore.remove(r.id)">Delete</button>
        </li>
      } @empty { <li>No rules yet.</li> }
    </ul>
  `,
})
export class RulesComponent implements HasUnsavedChanges {
  protected readonly ruleStore = inject(RuleStore);
  private readonly repo = inject(StorageRepository);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.control('', {
      validators: [Validators.required],
      asyncValidators: [
        uniqueRuleName(() => this.repo.read<Rule[]>(RULES_KEY, []), () => this.editingId()),
      ],
    }),
    severity: this.fb.control<Severity>('Warning'),
    combinator: this.fb.control<Combinator>('AND'),
    conditions: new FormArray<ConditionGroup>([this.newCondition()], { validators: [noDuplicateConditions] }),
  });

  protected get conditions(): FormArray<ConditionGroup> { return this.form.controls.conditions; }

  // Signals so OnPush re-renders when async validation completes.
  protected readonly nameStatus = toSignal(this.form.controls.name.statusChanges, {
    initialValue: this.form.controls.name.status,
  });
  protected readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected hasDuplicate(): boolean {
    this.formStatus();
    return this.conditions.hasError('duplicatePair');
  }

  private newCondition(c?: Condition): ConditionGroup {
    return this.fb.group({
      field: this.fb.control<RuleField>(c?.field ?? 'amount'),
      operator: this.fb.control<Operator>(c?.operator ?? '>'),
      value: this.fb.control(c?.value ?? '', Validators.required),
    });
  }

  addCondition(): void { this.conditions.push(this.newCondition()); }
  removeCondition(i: number): void { this.conditions.removeAt(i); }

  edit(rule: Rule): void {
    this.editingId.set(rule.id);
    this.conditions.clear();
    rule.conditions.forEach((c) => this.conditions.push(this.newCondition(c)));
    this.form.patchValue({ name: rule.name, severity: rule.severity, combinator: rule.combinator });
    this.form.markAsPristine();
  }

  cancelEdit(): void { this.resetForm(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.ruleStore.upsert({
      id: this.editingId() ?? crypto.randomUUID(),
      name: v.name.trim(), severity: v.severity, combinator: v.combinator, conditions: v.conditions,
    });
    this.resetForm();
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.conditions.clear();
    this.conditions.push(this.newCondition());
    this.form.reset({ name: '', severity: 'Warning', combinator: 'AND' });
    this.form.markAsPristine();
  }

  hasUnsavedChanges(): boolean { return this.form.dirty; }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.form.dirty) e.preventDefault();
  }
}