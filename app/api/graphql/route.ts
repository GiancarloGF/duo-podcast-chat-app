import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import dbConnect from '@/lib/db';
import { getEpisodeModel } from '@/models/Episode';
import { getChatModel } from '@/models/Chat';

const FAKE_USER_ID = 'fake-user-123';

const typeDefs = /* GraphQL */ `
  type Character {
    name: String
    role: String
  }

  type KeyPoint {
    type: String
    concept: String
    word: String
    example: String
    definition_es: String
    definition_en: String
  }

  type Message {
    id: String!
    sender: String
    senderType: String
    language: String
    requiresTranslation: Boolean
    content: String
    contentHtml: String
    contentMarkdown: String
    officialTranslation: String
    keyPoints: [KeyPoint!]!
  }

  type EpisodeCard {
    id: ID!
    number: Int
    title: String
    url: String
    imageUrl: String
    summaryText: String
    summaryHtml: String
    languageLevel: String
    themes: [String!]!
    characters: [Character!]!
    messageCount: Int!
  }

  type Episode {
    id: ID!
    number: Int
    title: String
    url: String
    imageUrl: String
    summaryText: String
    summaryHtml: String
    languageLevel: String
    themes: [String!]!
    characters: [Character!]!
    messages: [Message!]!
  }

  type TranslationFeedback {
    analysis: String
    score: Int
    suggestions: [String!]!
    differences: String
    detailedAnalysis: DetailedAnalysis
    phrasalVerbs: PhrasalVerbs
  }

  type DetailedAnalysis {
    grammar: String
    vocabulary: String
    construction: String
  }

  type PhrasalVerbs {
    relevant: Boolean!
    suggestions: [String!]!
  }

  type ChatMessage {
    id: String!
    episodeMessageId: String
    sender: String!
    message: String!
    isUserMessage: Boolean!
    translationFeedback: TranslationFeedback
    timestamp: String
  }

  type Chat {
    id: ID!
    episodeId: String!
    userId: String!
    status: String!
    progress: Int!
    messages: [ChatMessage!]!
    createdAt: String
    updatedAt: String
  }

  type ChatCard {
    id: ID!
    episodeId: String!
    userId: String!
    status: String!
    progress: Int!
  }

  type EpisodeWithChat {
    episode: Episode!
    chat: Chat
  }

  type HomeSummary {
    episodes: [EpisodeCard!]!
    chats: [ChatCard!]!
  }

  type Query {
    homeSummary: HomeSummary!
    episodeWithChat(episodeId: String!): EpisodeWithChat!
  }
`;

const resolvers = {
  Query: {
    homeSummary: async () => {
      await dbConnect();
      const Episode = getEpisodeModel();
      const Chat = getChatModel();

      const [episodes, chats] = await Promise.all([
        Episode.aggregate([
          {
            $project: {
              id: 1,
              number: 1,
              title: 1,
              url: 1,
              imageUrl: 1,
              summaryText: 1,
              summaryHtml: 1,
              languageLevel: 1,
              themes: 1,
              characters: 1,
              messageCount: { $size: '$messages' },
            },
          },
          { $sort: { createdAt: -1 } },
        ]),
        Chat.find({ userId: FAKE_USER_ID })
          .select('_id episodeId userId status progress')
          .sort({ updatedAt: -1 })
          .lean(),
      ]);

      return {
        episodes,
        chats: chats.map((chat) => ({
          ...chat,
          id: chat._id?.toString?.() || chat.id,
        })),
      };
    },
    episodeWithChat: async (_: any, { episodeId }: { episodeId: string }) => {
      await dbConnect();
      const Episode = getEpisodeModel();
      const Chat = getChatModel();

      // Fetch episode and chat in parallel
      const [episode, chat] = await Promise.all([
        Episode.findOne({ id: episodeId }).lean(),
        Chat.findOne({
          userId: FAKE_USER_ID,
          episodeId: episodeId,
        }).lean(),
      ]);

      if (!episode) {
        throw new Error(`Episode with id ${episodeId} not found`);
      }

      // Filter out messages without valid ids to prevent GraphQL errors
      const validMessages = (episode.messages || []).filter(
        (msg: any) => msg && msg.id != null && msg.id !== ''
      );

      return {
        episode: {
          ...episode,
          messages: validMessages,
        },
        chat: chat
          ? {
              ...chat,
              id: chat._id?.toString() || chat.id,
              messages: (chat.messages || []).map((msg: any) => ({
                ...msg,
                timestamp: msg.timestamp
                  ? new Date(msg.timestamp).toISOString()
                  : null,
              })),
            }
          : null,
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };

