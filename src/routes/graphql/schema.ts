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
  GraphQLInputObjectType
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
        id:  { type: new GraphQLNonNull(MemberTypeId) },
        discount: { type: new GraphQLNonNull(GraphQLFloat)},
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

const Profile = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
        id: { type: new GraphQLNonNull(UUIDType) },
        isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
        yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
        memberTypeId: { type: MemberTypeId },
    }),
  });

const User = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: new GraphQLNonNull(UUIDType) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        balance: { type: new GraphQLNonNull(GraphQLFloat) },
        profile: { type: Profile },
        posts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))) },
        // userSubscribedTo: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))) },
        // subscribedToUser: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))) },
    }),
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

                if (memberType === null){
                    throw new Error(`Member type with ID ${id} not found`);
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
                        userSubscribedTo: true,
                        subscribedToUser: true
                    }
                });

                if (user === null) {
                    throw new Error(`Member type with ID ${id} not found`);
                }

                return user;
            }
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

                if (post === null) {
                    throw new Error(`Member type with ID ${id} not found`);
                }

                return post;
            }
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
                    throw new Error(`Member type with ID ${id} not found`);
                }

                return profile;
            }
        },
  }),
});

const Mutations = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        createUser: {
            type: new GraphQLNonNull(User),
            args: {
                dto: { type: new GraphQLNonNull(CreateUserInput) },
            },
            resolve: () => 'WIP',
        },

        createProfile: {
            type: new GraphQLNonNull(Profile),
            args: {
                dto: { type: new GraphQLNonNull(CreateProfileInput) },
            },
            resolve: () => 'WIP',
        },

        createPost: {
            type: new GraphQLNonNull(Post),
            args: {
                dto: { type: new GraphQLNonNull(CreatePostInput) },
            },
            resolve: () => 'WIP',
        },

        changeUser: {
            type: new GraphQLNonNull(User),
            args: {
                id: { type: new GraphQLNonNull(UUIDType) },
                dto: { type: new GraphQLNonNull(ChangeUserInput) },
            },
            resolve: () => 'WIP',
        },

        changeProfile: {
            type: new GraphQLNonNull(Profile),
            args: {
                id: { type: new GraphQLNonNull(UUIDType) },
                dto: { type: new GraphQLNonNull(ChangeProfileInput) },
            },
            resolve: () => 'WIP',
        },

        changePost: {
            type: new GraphQLNonNull(Post),
            args: {
                id: { type: new GraphQLNonNull(UUIDType) },
                dto: { type: new GraphQLNonNull(ChangePostInput) },
            },
            resolve: () => 'WIP',
        },

        deleteUser: {
            type: new GraphQLNonNull(GraphQLString),
            args: {
                id: { type: new GraphQLNonNull(UUIDType) },
            },
            resolve: () => 'WIP',
        },

        deletePost: {
            type: new GraphQLNonNull(GraphQLString),
            args: {
                id: { type: new GraphQLNonNull(UUIDType) },
            },
            resolve: () => 'WIP',
        },

        deleteProfile: {
            type: new GraphQLNonNull(GraphQLString),
            args: {
                id: { type: new GraphQLNonNull(UUIDType) },
            },
            resolve: () => 'WIP',
        },

        subscribeTo: {
            type: new GraphQLNonNull(GraphQLString),
            args: {
                userId: { type: new GraphQLNonNull(UUIDType) },
                authorId: { type: new GraphQLNonNull(UUIDType) },
            },
            resolve: () => 'WIP',
        },

        unsubscribeFrom: {
            type: new GraphQLNonNull(GraphQLString),
            args: {
                userId: { type: new GraphQLNonNull(UUIDType) },
                authorId: { type: new GraphQLNonNull(UUIDType) },
            },
            resolve: () => 'WIP',
        }    
    })
});

export const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutations,
});
