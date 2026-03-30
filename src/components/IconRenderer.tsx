import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  iconName: string;
  size?: number;
  className?: string;
  color?: string;
}

const IconRenderer: React.FC<IconRendererProps> = ({ iconName, size = 24, className, color }) => {
  const LucideIcon = (LucideIcons as any)[iconName];
  const style = color ? { color } : {};
  
  if (!LucideIcon) {
    return <LucideIcons.Tag size={size} className={className} style={style} />; // Fallback
  }
  
  return <LucideIcon size={size} className={className} style={style} />;
};

export default IconRenderer;
