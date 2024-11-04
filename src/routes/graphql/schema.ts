import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
} from 'graphql';
import { ContextType } from './context.js';
import { UUIDType } from './types/uuid.js';

const ChangePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: () => ({
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  }),
});

const ChangeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: () => ({
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeId },
  }),
});

const ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: () => ({
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  }),
});

const CreatePostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  }),
});

const CreateProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: () => ({
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(UUIDType) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeId) },
  }),
});

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

const MemberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: { value: 'BASIC' },
    BUSINESS: { value: 'BUSINESS' },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'Member',
  fields: () => ({
    id: { type: new GraphQLNonNull(MemberTypeId) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

const Post = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

interface ProfileType {
  id: string;
  isMale: boolean;
  yearOfBirth: number;
  memberTypeId: 'BASIC' | 'BUSINESS';
}

const Profile = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberType: {
      type: new GraphQLNonNull(MemberType),
      resolve: async (parent: ProfileType, args, context: ContextType) => {
        const { prisma } = context;
        return await prisma.memberType.findUnique({ where: { id: parent.memberTypeId } });
      },
    },
  }),
});

const UserInterface: GraphQLInterfaceType = new GraphQLInterfaceType({
  name: 'UserInterface',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserInterface))),
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserInterface))),
    },
  }),
});

interface UserType {
  id: string;
  name: string;
  balance: number;
}

const User = new GraphQLObjectType({
  name: 'User',
  interfaces: [UserInterface],
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: Profile,
      resolve: async (parent: UserType, args, context: ContextType) => {
        const { prisma } = context;
        return await prisma.profile.findUnique({ where: { userId: parent.id } });
      },
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: async (parent: UserType, args, context: ContextType) => {
        const { prisma } = context;
        return await prisma.post.findMany({ where: { authorId: parent.id } });
      },
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserInterface))),
      resolve: async (parent: UserType, args, context: ContextType) => {
        const { prisma } = context;
        const subscribedTo = await prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: parent.id,
              },
            },
          },
          include: {
            subscribedToUser: true,
          },
        });

        return subscribedTo;
      },
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserInterface))),
      resolve: async (parent: UserType, args, context: ContextType) => {
        const { prisma } = context;
        const subscribedToUser = await prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: parent.id,
              },
            },
          },
          include: {
            userSubscribedTo: true,
          },
        });

        return subscribedToUser;
      },
    },
  }),
  isTypeOf: (obj) => {
    return obj && typeof obj.id === 'string';
  },
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQuery',
  description: 'Root query',
  fields: () => ({
    memberTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
      resolve: async (_parent, args, context: ContextType) => {
        const { prisma } = context;
        return await prisma.memberType.findMany();
      },
    },

    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeId) },
      },
      resolve: async (_parent, { id }: { id: string }, context: ContextType) => {
        const { prisma } = context;

        const memberType = await prisma.memberType.findUnique({
          where: { id },
        });

        if (memberType === null) {
          return null;
        }

        return memberType;
      },
    },

    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: async (_parent, args, context: ContextType) => {
        const { prisma } = context;

        return await prisma.user.findMany();
      },
    },

    user: {
      type: User,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, context: ContextType) => {
        const { prisma } = context;

        const user = await prisma.user.findUnique({
          where: { id },
          include: {
            profile: {
              include: {
                memberType: true,
              },
            },
            posts: true,
          },
        });

        if (!user) {
          return null;
        }

        return user;
      },
    },

    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: async (_parent, args, context: ContextType) => {
        const { prisma } = context;
        return await prisma.post.findMany();
      },
    },

    post: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, context: ContextType) => {
        const { prisma } = context;

        const post = await prisma.post.findUnique({
          where: { id },
        });

        if (!post) {
          return null;
        }

        return post;
      },
    },

    profiles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Profile))),
      resolve: async (_parent, args, context: ContextType) => {
        const { prisma } = context;
        return await prisma.profile.findMany();
      },
    },

    profile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, context: ContextType) => {
        const { prisma } = context;
        const profile = await prisma.profile.findUnique({
          where: { id },
        });

        if (profile === null) {
          return null;
        }

        return profile;
      },
    },
  }),
});

interface CreateProfileDto {
  isMale: boolean;
  yearOfBirth: number;
  userId: string;
  memberTypeId: 'BASIC' | 'BUSINESS';
}

interface ChangeUserDto {
  name?: string;
  balance?: number;
}

const Mutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createUser: {
      type: new GraphQLNonNull(User),
      args: {
        dto: { type: new GraphQLNonNull(CreateUserInput) },
      },
      resolve: async (
        _parent,
        args: { dto: { name: string; balance: number } },
        context: ContextType,
      ) => {
        const { prisma } = context;

        if (!Number.isFinite(args.dto.balance)) {
          throw new Error('Balance must be a valid number');
        }

        return prisma.user.create({
          data: args.dto,
        });
      },
    },

    createProfile: {
      type: new GraphQLNonNull(Profile),
      args: {
        dto: { type: new GraphQLNonNull(CreateProfileInput) },
      },
      resolve: async (_parent, args: { dto: CreateProfileDto }, context: ContextType) => {
        const { prisma } = context;

        return prisma.profile.create({
          data: args.dto,
        });
      },
    },

    createPost: {
      type: new GraphQLNonNull(Post),
      args: {
        dto: { type: new GraphQLNonNull(CreatePostInput) },
      },
      resolve: async (
        _parent,
        args: { dto: { title: string; content: string; authorId: string } },
        context: ContextType,
      ) => {
        const { prisma } = context;

        return prisma.post.create({
          data: args.dto,
        });
      },
    },

    changeUser: {
      type: new GraphQLNonNull(User),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInput) },
      },
      resolve: async (
        _parent,
        args: { id: string; dto: ChangeUserDto },
        context: ContextType,
      ) => {
        const { prisma } = context;

        return prisma.user.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },

    changeProfile: {
      type: new GraphQLNonNull(Profile),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInput) },
      },
      resolve: async (
        _parent,
        args: {
          id: string;
          dto: {
            isMale: boolean;
            yearOfBirth: number;
            memberTypeId: 'BASIC' | 'BUSINESS';
          };
        },
        context: ContextType,
      ) => {
        const { prisma } = context;

        return prisma.profile.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },

    changePost: {
      type: new GraphQLNonNull(Post),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangePostInput) },
      },
      resolve: async (
        _parent,
        args: { id: string; dto: { title: string; content: string } },
        context: ContextType,
      ) => {
        const { prisma } = context;

        return prisma.post.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },

    deleteUser: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, context: ContextType) => {
        const { prisma } = context;

        await prisma.user.delete({
          where: { id },
        });

        return 'User deleted successfully!';
      },
    },

    deletePost: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, context: ContextType) => {
        const { prisma } = context;

        await prisma.post.delete({
          where: { id },
        });

        return 'Post deleted successfully!';
      },
    },

    deleteProfile: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, context: ContextType) => {
        const { prisma } = context;

        await prisma.profile.delete({
          where: { id },
        });

        return 'Profile deleted successfully!';
      },
    },

    subscribeTo: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (
        _parent,
        args: { userId: string; authorId: string },
        context: ContextType,
      ) => {
        const { prisma } = context;
        try {
          const user = await prisma.user.findUnique({ where: { id: args.userId } });
          const author = await prisma.user.findUnique({ where: { id: args.authorId } });

          if (!user || !author) {
            return null;
          }

          const existingSubscription = await prisma.subscribersOnAuthors.findUnique({
            where: {
              subscriberId_authorId: {
                subscriberId: args.userId,
                authorId: args.authorId,
              },
            },
          });

          if (existingSubscription) {
            return null;
          }

          await prisma.subscribersOnAuthors.create({
            data: {
              subscriberId: args.userId,
              authorId: args.authorId,
            },
          });

          return 'User subscribed successfully!';
        } catch (error) {
          console.error('Error subscribing user:', error);
          throw new Error('Failed to subscribe user.');
        }
      },
    },

    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (
        _parent,
        args: { userId: string; authorId: string },
        context: ContextType,
      ) => {
        const { prisma } = context;

        try {
          const subscription = await prisma.subscribersOnAuthors.findUnique({
            where: {
              subscriberId_authorId: {
                subscriberId: args.userId,
                authorId: args.authorId,
              },
            },
          });

          if (!subscription) {
            return 'No subscription found to unsubscribe';
          }

          await prisma.subscribersOnAuthors.delete({
            where: {
              subscriberId_authorId: {
                subscriberId: args.userId,
                authorId: args.authorId,
              },
            },
          });

          return 'User unsubscribed successfully!';
        } catch (error) {
          console.error('Error unsubscribing user:', error);
          throw new Error('Failed to unsubscribe user.');
        }
      },
    },
  }),
});

export const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutations,
});
