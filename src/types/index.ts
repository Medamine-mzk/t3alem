export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface CourseWithRelations {
  id: string;
  title: string;
  description: string;
  className: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  sessions?: {
    id: string;
    title: string;
    date: Date;
  }[];
  _count?: {
    sessions: number;
  };
}

export interface SessionWithRelations {
  id: string;
  courseId: string;
  title: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  contentBlocks: {
    id: string;
    type: string;
    content: string;
    position: number;
  }[];
  comments?: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
  _count?: {
    comments: number;
    visits: number;
  };
}
