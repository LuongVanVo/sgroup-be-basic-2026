let MOCK_USERS = [
  { id: 1, full_name: 'Admin SGroup', email: 'admin@gmail.com', role: 'admin', is_active: true, password_hash: '$2b$10$p6c4LN82KyIbV8sLfdrFM.3XyHRffgC.UZV1zroLDL720aQwg1pD2' },
  { id: 2, full_name: 'Khách Hàng Mẫu', email: 'customer@gmail.com', role: 'customer', is_active: true, password_hash: '$2b$10$wsk8tATssJbClGGR46qdb.olxAY4u00Jod06jC.7lLNpo.jbpzU4e' },
  { id: 3, full_name: 'Nguyen Van An', email: 'an@gmail.com', role: 'admin', is_active: true, password_hash: '$2b$10$p6c4LN82KyIbV8sLfdrFM.3XyHRffgC.UZV1zroLDL720aQwg1pD2' },
  { id: 4, full_name: 'Tran Thi Binh', email: 'binh@gmail.com', role: 'customer', is_active: true, password_hash: '$2b$10$wsk8tATssJbClGGR46qdb.olxAY4u00Jod06jC.7lLNpo.jbpzU4e' },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAllUsersFromDB = async () => {
  await delay(200);
  return [...MOCK_USERS];
};

export const getUserByIdFromDB = async (id) => {
  await delay(100);
  return MOCK_USERS.find((u) => u.id === id) ?? null;
};

export const getUserByEmailFromDB = async (email) => {
  await delay(100);
  return MOCK_USERS.find((u) => u.email === email) ?? null;
};

export const createUserInDB = async ({ fullName, email, role = 'user', password }) => {
  await delay(200);
  const newUser = {
    id: MOCK_USERS.length + 1,
    full_name: fullName,
    email,
    role,
    is_active: true,
    password_hash: `$2b$10$mockhashed_${password}`,
    created_at: new Date().toISOString(),
  };
  MOCK_USERS.push(newUser);
  return { ...newUser };
};
