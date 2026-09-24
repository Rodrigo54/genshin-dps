import {
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  type ConnectedPosition,
  type OverlayRef,
  type PositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  type OnDestroy,
  signal,
} from '@angular/core';

const TOOLTIP_OFFSET_PX = 8;

const POSITIONS: ConnectedPosition[] = [
  { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -TOOLTIP_OFFSET_PX },
  { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: TOOLTIP_OFFSET_PX },
];

let nextTooltipId = 0;

export function createTooltipId(): string {
  return `app-tooltip-${nextTooltipId++}`;
}

// Overlay de tooltip: acompanha a rolagem da página em vez de fechar
export function createTooltipOverlay(injector: Injector, positionStrategy: PositionStrategy): OverlayRef {
  return createOverlayRef(injector, { positionStrategy, scrollStrategy: createRepositionScrollStrategy(injector) });
}

@Component({
  selector: 'app-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    '[id]': 'id()',
    class: 'pointer-events-none block max-w-72 rounded-md bg-surface-raised px-2.5 py-1.5 text-sm text-ink shadow-lg',
  },
  template: `{{ text() }}`,
})
export class TooltipPanel {
  readonly id = input.required<string>();
  readonly text = input.required<string>();
}

// Tooltip de texto sobre o CDK Overlay: aparece no hover e no foco do teclado
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class Tooltip implements OnDestroy {
  readonly appTooltip = input.required<string>();

  private readonly injector = inject(Injector);
  private readonly origin = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tooltipId = createTooltipId();
  private overlayRef?: OverlayRef;
  protected readonly describedBy = signal<string | null>(null);

  show(): void {
    if (this.overlayRef) return;
    this.overlayRef = createTooltipOverlay(
      this.injector,
      createFlexibleConnectedPositionStrategy(this.injector, this.origin).withPositions(POSITIONS),
    );
    const panel = this.overlayRef.attach(new ComponentPortal(TooltipPanel));
    panel.setInput('id', this.tooltipId);
    panel.setInput('text', this.appTooltip());
    this.describedBy.set(this.tooltipId);
  }

  hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.describedBy.set(null);
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
