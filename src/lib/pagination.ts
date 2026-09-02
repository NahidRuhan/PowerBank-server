export const parsePagination = (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = Math.min(parseInt(query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
};
