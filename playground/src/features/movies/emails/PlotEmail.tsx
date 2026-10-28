import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  pixelBasedPreset,
  Preview,
  render,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

import { buildPlotEmailContent, type PlotEmailContentType } from '@/features/movies/domain/rules';

export function PlotEmail({ title, posterUrl, details, rating, director, plot }: PlotEmailContentType) {
  return (
    <Html lang="en">
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />
        <Preview>{`You just watched ${title}. Here's the plot.`}</Preview>
        <Body className="m-0 bg-zinc-100 py-10 font-sans">
          <Container className="rounded-2xl mx-auto max-w-140 border border-solid border-zinc-200 bg-white p-8">
            <Text className="m-0 text-xs font-semibold tracking-widest text-indigo-600 uppercase">
              You just watched
            </Text>

            <Section className="mt-5">
              <Row>
                {posterUrl && (
                  <Column className="w-34 pr-6 align-top">
                    <Img src={posterUrl} alt={`${title} poster`} width="112" height="166" className="rounded-[8px]" />
                  </Column>
                )}
                <Column className="align-top">
                  <Heading as="h1" className="m-0 text-2xl leading-8 font-bold text-zinc-900">
                    {title}
                  </Heading>
                  {details.length > 0 && <Text className="m-0 mt-2 text-sm text-zinc-500">{details.join(' · ')}</Text>}
                  {rating && (
                    <Text className="m-0 mt-3 text-sm font-semibold text-zinc-900">
                      ★ {rating} <span className="font-normal text-zinc-500">on IMDb</span>
                    </Text>
                  )}
                  {director && <Text className="m-0 mt-1 text-sm text-zinc-500">Directed by {director}</Text>}
                </Column>
              </Row>
            </Section>

            <Hr className="my-7 border-zinc-200" />

            <Heading as="h2" className="m-0 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
              Plot
            </Heading>
            <Text className="m-0 mt-3 text-[15px] leading-7 text-zinc-700">{plot}</Text>
          </Container>

          <Text className="m-0 mt-6 text-center text-xs text-zinc-400">Movie data from OMDb</Text>
        </Body>
      </Tailwind>
    </Html>
  );
}

PlotEmail.PreviewProps = buildPlotEmailContent({
  title: 'The Matrix',
  year: '1999',
  plot: 'Thomas A. Anderson is a man living two lives. By day he is an average computer programmer and by night a hacker known as Neo. Neo has always questioned his reality, but the truth is far beyond his imagination.',
  poster:
    'https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg',
  runtime: '136 min',
  genre: 'Action, Sci-Fi',
  director: 'Lana Wachowski, Lilly Wachowski',
  imdbRating: '8.7',
}) satisfies PlotEmailContentType;

export default PlotEmail;

export async function renderPlotEmail(content: PlotEmailContentType) {
  const email = <PlotEmail {...content} />;
  const [html, text] = await Promise.all([render(email), render(email, { plainText: true })]);

  return { subject: content.subject, html, text };
}
