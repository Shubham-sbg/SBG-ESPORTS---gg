import React, { useId, ReactNode, Children, isValidElement, InputHTMLAttributes } from 'react';

export interface ComboboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number | undefined | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  children: ReactNode;
}

export default function Combobox({ 
  value, 
  onChange, 
  children, 
  className,
  placeholder,
  ...props
}: ComboboxProps) {
  const id = useId();
  
  const options: { value: string, label: string }[] = [];
  Children.forEach(children, child => {
    if (isValidElement(child) && child.type === 'option') {
      options.push({
        value: String(child.props.value ?? child.props.children),
        label: String(child.props.children)
      });
    }
  });

  return (
    <div className="relative w-full">
      <input 
        type="text" 
        list={id} 
        value={value != null ? String(value) : ''} 
        onChange={onChange} 
        placeholder={placeholder ?? 'Select or type...'} 
        className={className} 
        {...props}
      />
      <datalist id={id}>
        {options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
      </datalist>
    </div>
  );
}
