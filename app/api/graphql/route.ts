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

  type EpisodeCard {
    id: ID!
    title: String
    imageUrl: String
    summaryText: String
    summaryHtml: String
    languageLevel: String
    themes: [String!]!
    characters: [Character!]!
    messageCount: Int!
  }

  type ChatCard {
    id: ID!
    episodeId: String!
    userId: String!
    status: String!
    progress: Int!
  }

  type HomeSummary {
    episodes: [EpisodeCard!]!
    chats: [ChatCard!]!
  }

  type Query {
    homeSummary: HomeSummary!
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
              title: 1,
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
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };

