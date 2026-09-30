// Barebones component interface that includes the basic properties required for
// reliable automated UI testing. Will also allow passing styling classnames to our custom components
export interface BaseComponent {
  id?: string;
  className?: string;
}
