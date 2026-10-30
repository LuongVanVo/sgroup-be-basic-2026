import * as categoryRepo from '../repositories/category.repository.js';

export const getAllCategories = async () => {
  const categories = await categoryRepo.findAllCategories();
  return categories.map((c) => c.toResponseObject());
};
