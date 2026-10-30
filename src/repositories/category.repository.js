import pool from '../configs/db.config.js';
import { CategoryEntity } from '../entities/category.entity.js';

export const findAllCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
  return rows.map((row) => CategoryEntity.fromDatabaseRow(row));
};

export const findCategoryById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  return CategoryEntity.fromDatabaseRow(rows[0]);
};
