import { getLocales } from 'expo-localization';
import { Redirect } from 'expo-router';

const deviceLanguage = getLocales()[0].languageCode;

const Home = () => {
	return <Redirect href={`/${deviceLanguage}`} />;
};

export default Home;
