import Image from 'next/image';
import { Fragment } from 'react';
import type {
  ChangelogContentBlock,
  ChangelogEntry,
  ChangelogEntryData,
} from '@/entities/system/changelog.entities';

function renderText(body: ChangelogContentBlock & { type: 'text' }) {
  const paragraphs = Array.isArray(body.body) ? body.body : [body.body];
  return paragraphs.map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>);
}

function renderList(block: ChangelogContentBlock & { type: 'list' }) {
  return (
    <ul className='list-inside list-disc space-y-1'>
      {block.items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function renderImage(block: ChangelogContentBlock & { type: 'image' }) {
  return (
    <figure className='space-y-2'>
      <Image
        src={block.src}
        alt={block.alt}
        width={block.width}
        height={block.height}
        className='w-full rounded-xl object-cover'
      />
      {block.caption ? (
        <figcaption className='text-muted-foreground text-xs tracking-[0.3em] uppercase'>
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function renderBlock(block: ChangelogContentBlock, index: number) {
  switch (block.type) {
    case 'text':
      return <Fragment key={`text-${index}`}>{renderText(block)}</Fragment>;
    case 'list':
      return <Fragment key={`list-${index}`}>{renderList(block)}</Fragment>;
    case 'image':
      return <Fragment key={`image-${index}`}>{renderImage(block)}</Fragment>;
    default:
      return null;
  }
}

export function createChangelogEntry(entryData: ChangelogEntryData): ChangelogEntry {
  const Content = () => (
    <>
      {entryData.sections.map((section) => (
        <section key={section.id} className='space-y-3'>
          <h2>{section.title}</h2>
          {section.blocks.map((block, blockIndex) => renderBlock(block, blockIndex))}
        </section>
      ))}
    </>
  );

  Content.displayName = `ChangelogEntry_${entryData.metadata.version}`;

  return {
    ...entryData.metadata,
    Content,
  };
}
