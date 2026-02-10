import { FieldSelect } from './fields/field-select';
import { Form } from './shared/form';
import { SubmitButton } from './shared/submit-button';

export const createForm = <T extends object>() => {
	return {
		Form: Form<T>,
		FieldSelect: FieldSelect<T>,
		SubmitButton
	};
};
