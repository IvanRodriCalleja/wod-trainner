import type { ComponentType } from 'react';

import { html } from 'react-strict-dom';
import { withUniwind } from 'uniwind';

export const NativeComponent = <P extends object>(Component: ComponentType<P>) => {
	const Wrapped = ({ className, ...props }: P & { className?: string }) => (
		<Component {...(props as P)} />
	);
	Wrapped.displayName = `html.${Component.displayName || Component.name || 'Component'}`;
	return Wrapped;
};

// Layout & Structure
export const Div = withUniwind(NativeComponent(html.div));
export const Span = withUniwind(NativeComponent(html.span));
export const Section = withUniwind(NativeComponent(html.section));
export const Article = withUniwind(NativeComponent(html.article));
export const Nav = withUniwind(NativeComponent(html.nav));
export const Aside = withUniwind(NativeComponent(html.aside));
export const Header = withUniwind(NativeComponent(html.header));
export const Footer = withUniwind(NativeComponent(html.footer));
export const Main = withUniwind(NativeComponent(html.main));

// Headings
export const H1 = withUniwind(NativeComponent(html.h1));
export const H2 = withUniwind(NativeComponent(html.h2));
export const H3 = withUniwind(NativeComponent(html.h3));
export const H4 = withUniwind(NativeComponent(html.h4));
export const H5 = withUniwind(NativeComponent(html.h5));
export const H6 = withUniwind(NativeComponent(html.h6));

// Text Content
export const P = withUniwind(NativeComponent(html.p));
export const A = withUniwind(NativeComponent(html.a));
export const Strong = withUniwind(NativeComponent(html.strong));
export const Em = withUniwind(NativeComponent(html.em));
export const B = withUniwind(NativeComponent(html.b));
export const I = withUniwind(NativeComponent(html.i));
export const U = withUniwind(NativeComponent(html.u));
export const S = withUniwind(NativeComponent(html.s));
export const Code = withUniwind(NativeComponent(html.code));
export const Kbd = withUniwind(NativeComponent(html.kbd));
export const Pre = withUniwind(NativeComponent(html.pre));
export const Mark = withUniwind(NativeComponent(html.mark));
export const Del = withUniwind(NativeComponent(html.del));
export const Ins = withUniwind(NativeComponent(html.ins));
export const Sub = withUniwind(NativeComponent(html.sub));
export const Sup = withUniwind(NativeComponent(html.sup));
export const Bdi = withUniwind(NativeComponent(html.bdi));
export const Bdo = withUniwind(NativeComponent(html.bdo));

// Lists
export const Ul = withUniwind(NativeComponent(html.ul));
export const Ol = withUniwind(NativeComponent(html.ol));
export const Li = withUniwind(NativeComponent(html.li));

// Forms
export const Form = withUniwind(NativeComponent(html.form));
export const Input = withUniwind(NativeComponent(html.input));
export const Textarea = withUniwind(NativeComponent(html.textarea));
export const Select = withUniwind(NativeComponent(html.select));
export const Optgroup = withUniwind(NativeComponent(html.optgroup));
export const Option = withUniwind(NativeComponent(html.option));
export const Label = withUniwind(NativeComponent(html.label));
export const Fieldset = withUniwind(NativeComponent(html.fieldset));

// Media
export const Img = withUniwind(NativeComponent(html.img));

// Other Common Elements
export const Hr = withUniwind(NativeComponent(html.hr));
export const Br = withUniwind(NativeComponent(html.br));
export const Blockquote = withUniwind(NativeComponent(html.blockquote));
