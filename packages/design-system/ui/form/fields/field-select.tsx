import { Description, Label, TextField } from 'heroui-native';
import { Path, useController, useFormContext } from 'react-hook-form';

import { Option } from '../../../domain/Option';
import { AppText } from '../../text';
import { Select, SelectSize } from '../inputs/select';

type FieldSelectProps<T> = {
	name: Path<T>;
	options: Option[];
	label: string;
	description?: string;
	placeholder?: string;
	size?: SelectSize;
};

export const FieldSelect = <T extends object>({
	name,
	options,
	label,
	description,
	placeholder = 'Select an option',
	size = 'md'
}: FieldSelectProps<T>) => {
	const { control } = useFormContext<T>();
	const { field } = useController({ control, name });

	return (
		<TextField>
			<Label>{label}</Label>

			<Select.SheetRoot
				onBlur={field.onBlur}
				value={field.value}
				onValueChange={option => field.onChange(option?.value)}>
				<Select.Trigger>
					<Select.AnimatedTrigger placeholder={placeholder} options={options} size={size} />
				</Select.Trigger>
				<Select.Portal>
					<Select.Overlay />
					<Select.SheetContent>
						<Select.SheetScrollView>
							{options.map(({ value, label }) => (
								<Select.Item
									key={value}
									value={value as string}
									label={label}
									className="px-3 py-5">
									<AppText className="åtext-sm font-medium">{label}</AppText>
									<Select.ItemIndicator />
								</Select.Item>
							))}
						</Select.SheetScrollView>
					</Select.SheetContent>
				</Select.Portal>
			</Select.SheetRoot>
			{description && <Description>{description}</Description>}
		</TextField>
	);
};
