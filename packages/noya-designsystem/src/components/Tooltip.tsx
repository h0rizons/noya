import styled from 'styled-components';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Slot } from '@radix-ui/react-slot';
import { memo, ReactNode } from 'react';

const Arrow = styled(TooltipPrimitive.Arrow)(({ theme }) => ({
  fill: theme.colors.popover.background,
}));

const Content = styled(TooltipPrimitive.Content)(({ theme }) => ({
  ...theme.textStyles.small,
  color: theme.colors.text,
  borderRadius: 3,
  padding: `${theme.sizes.spacing.small}px ${theme.sizes.spacing.medium}px`,
  backgroundColor: theme.colors.popover.background,
  boxShadow: '0 2px 4px rgba(0,0,0,0.2), 0 0 12px rgba(0,0,0,0.1)',
}));

interface Props {
  children: ReactNode;
  content: ReactNode;
}

export default memo(function Tooltip({ children, content }: Props) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger as={Slot}>{children}</TooltipPrimitive.Trigger>
      <Content side="bottom" align="center">
        {content}
        <Arrow />
      </Content>
    </TooltipPrimitive.Root>
  );
});
