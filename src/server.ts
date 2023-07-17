import Fastify from 'fastify'
import cors from '@fastify/cors'
import {PrismaClient} from '@prisma/client'
import { hash, compare } from "bcrypt";
import {z} from 'zod'
import jwt,  { JwtPayload } from 'jsonwebtoken';
const prisma = new PrismaClient({
    log: ['query'],

})
async function bootstrap(){

  interface TransacaoRequestParams {
    id: string;
    extratoId: string;
  }
  
  interface TransacaoRequestBody {
    descricao: string;
    categoria: string;
    valor: number;
    tipo: 'receita' | 'despesa';
  }


    const fastify = Fastify({
        logger:true
    })

    await fastify.register(cors, {
        origin: true,
    })
    fastify.post('/users', async (request, reply) => {
      const UserRegistrationSchema = z.object({
        email: z.string().email(),
        name: z.string(),
        password: z.string().min(6),
      });
    
      
      try {
        const { email, name, password } = UserRegistrationSchema.parse(request.body);
        const HashPassword = await hash(password, 8)

        // Gerar o hash da senha
        const hashedPassword = await hash(password, 10);

        const user = await prisma.user.create({
          data: {
            email,
            name,
            password:HashPassword,
          },
        });
    
        reply.code(201).send(user);
      } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    });




    fastify.post('/login', async (request, reply) => {
      const UserLoginSchema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
    
      try {
        const { email, password } = UserLoginSchema.parse(request.body);
    
        const user = await prisma.user.findUnique({
          where: { email },
        });
    
        if (!user) {
          reply.code(401).send({ error: 'Invalid credentials' });
          return;
        }
    
        const isMatch = await compare(password, user.password);
        if (!isMatch) {
          reply.code(401).send({ error: 'Invalid credentials' });
          return;
        }
    
        // Gerar o token JWT
        const token = jwt.sign({ email: user.email, userId: user.id }, 'secret', { expiresIn: '1h' });
        const data = {
          token,
          ...user
        }
        // Autenticação bem-sucedida, retornar o token JWT
        reply.code(200).send(data);
      } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    });
































    fastify.get('/account/search', async (request, reply) => {
      try {
        // Extrair o token JWT do cabeçalho da requisição
        const token = request.headers.authorization?.replace('Bearer ', '');
    
        // Verificar se o token JWT está presente
        if (!token) {
          return reply.status(401).send({ error: 'Token de autenticação não fornecido.' });
        }
    
        // Verificar se o token JWT é válido e decodificá-lo
        let decodedToken;
        try {
          decodedToken = jwt.verify(token, 'secret');
        } catch (error) {
          return reply.status(401).send({ error: 'Token de autenticação inválido.' });
        }
    
        // Verificar se o token JWT foi decodificado com sucesso
        if (!decodedToken) {
          return reply.status(401).send({ error: 'Token de autenticação inválido.' });
        }
        console.log(decodedToken)
    
        // Obter o ID do usuário a partir do token decodificado
        const userId = decodedToken.userId;
        // Verificar se o ID do usuário existe
        if (!userId) {
          return reply.status(401).send({ error: 'ID do usuário não encontrado no token.' });
        }
    
        // Buscar as contas bancárias associadas ao usuário logado
        const search = await prisma.contaBancaria.findMany({
          where: { userId: Number(userId) },
        });
    
        return reply.status(200).send({ search });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    });

    fastify.post('/account', async (request, reply) => {
      const createContaBancariaBody = z.object({
        nome: z.string(),
        saldo: z.number(),
      });
    
      try {
        const { nome, saldo } = createContaBancariaBody.parse(request.body);
    
        // Extrair o token JWT do cabeçalho da requisição
        const token = request.headers.authorization?.replace('Bearer ', '');
    
        // Verificar se o token JWT está presente
        if (!token) {
          return reply.status(401).send({ error: 'Token de autenticação não fornecido.' });
        }
    
        // Verificar se o token JWT é válido e decodificá-lo
        let decodedToken;
        try {
          decodedToken = jwt.verify(token, 'secret');
        } catch (error) {
          return reply.status(401).send({ error: 'Token de autenticação inválido.' });
        }
    
        // Verificar se o token JWT foi decodificado com sucesso
        if (!decodedToken) {
          return reply.status(401).send({ error: 'Token de autenticação inválido.' });
        }
    
        // Obter o ID do usuário a partir do token decodificado
        const userId = decodedToken.userId;
    
        // Verificar se o ID do usuário existe
        if (!userId) {
          return reply.status(401).send({ error: 'ID do usuário não encontrado no token.' });
        }
    
        const newAccount = await prisma.contaBancaria.create({
          data: {
            nome,
            saldo,
            userId: Number(userId), // Associar a conta bancária ao usuário logado
          },
        });
    
        return reply.status(201).send({ account: newAccount });
      } catch (error) {
        console.error(error);
        return reply.status(400).send({ error: 'Invalid request body' });
      }
    });
    
    

      
      fastify.put<{ Params: { id: string } }>('/account/:id', async (request, reply) => {
    
        const updateContaBancariaBody = z.object({
            nome: z.string().optional(),
            saldo: z.number().optional(),
        });
        try {
          const { id } = request.params;
          const { nome, saldo } = updateContaBancariaBody.parse(request.body);
      
          const updatedAccount = await prisma.contaBancaria.update({
            where: { id },
            data: {
              nome,
              saldo,
            },
          });
      
          return reply.status(200).send({ account: updatedAccount });
        } catch (error) {
          console.error(error);
          return reply.status(400).send({ error: 'Invalid request body' });
        }
      });
      

      fastify.delete<{ Params: { id: string } }>('/account/:id', async (request, reply) => {
        const { id } = request.params;
      
        // Verifica se a conta bancária existe
        const contaBancaria = await prisma.contaBancaria.findUnique({
          where: { id },
        });
      
        if (!contaBancaria) {
          return reply.status(404).send({ message: 'Conta bancária não encontrada.' });
        }
      
        // Deleta a conta bancária e seus extratos associados
        await prisma.extratoBancario.deleteMany({
          where: { contaBancariaId: id },
        });
      
        await prisma.contaBancaria.delete({
          where: { id },
        });
      
        return reply.status(200).send({ message: 'Conta bancária excluída com sucesso.' });
      });
      
      
      fastify.get<{ Params: { id: string } }>('/account/:id/extrato', async (request, reply) => {
        const { id } = request.params;
      
        const extrato = await prisma.contaBancaria.findUnique({
          where: { id },
          include: {
            extrato: true
          } as any,
        });
      
        return reply.status(200).send({ extrato });
      });



      fastify.post<{ Params: TransacaoRequestParams; Body: TransacaoRequestBody }>('/account/:id/extrato', async (request, reply) => {
        const { id } = request.params;
        const { descricao, categoria, valor, tipo } = request.body;
      
        const contaBancaria = await prisma.contaBancaria.findUnique({
          where: { id },
        });
      
        if (!contaBancaria) {
          return reply.status(404).send({ message: 'Conta bancária não encontrada.' });
        }

        const data = new Date(); // Supondo que você tenha a data atual no frontend
        const fusoHorarioBrasil = 3; // Ajuste o valor de acordo com o fuso horário do Brasil em relação ao UTC
        
        data.setHours(data.getHours() - fusoHorarioBrasil);
        
        const dataFormatada = data.toISOString();

        // Cria o registro no extrato
        const extrato = await prisma.extratoBancario.create({
          data: {
            descricao,
            categoria,
            valor,
            tipo,
            data: dataFormatada,
            contaBancaria: { connect: { id } },
          },
        });
        
        // Atualiza o saldo da conta com base no tipo de transação
        const saldoAtualizado =
          tipo === 'receita' ? contaBancaria.saldo + valor : contaBancaria.saldo - valor;
      
        await prisma.contaBancaria.update({
          where: { id },
          data: { saldo: saldoAtualizado },
        });
      
        return reply.status(201).send({ extrato, saldo: saldoAtualizado });
      });
      

      fastify.put<{ Params: TransacaoRequestParams; Body: TransacaoRequestBody }>('/account/:id/extrato/:extratoId', async (request, reply) => {
        const { id, extratoId } = request.params;
        const { descricao, categoria, valor, tipo } = request.body;
      
        const contaBancaria = await prisma.contaBancaria.findUnique({
          where: { id },
        });
      
        if (!contaBancaria) {
          return reply.status(404).send({ message: 'Conta bancária não encontrada.' });
        }
      
        const extratoAnterior = await prisma.extratoBancario.findUnique({
          where: { id: extratoId },
        });
      
        if (!extratoAnterior) {
          return reply.status(404).send({ message: 'Extrato não encontrado.' });
        }
      
        const saldoInicial = contaBancaria.saldo;
        let saldoAtualizado = saldoInicial;
      
        if (extratoAnterior.tipo === 'receita') {
          saldoAtualizado -= extratoAnterior.valor;
        } else {
          saldoAtualizado += extratoAnterior.valor;
        }
      
        if (tipo === 'receita') {
          saldoAtualizado += valor;
        } else {
          saldoAtualizado -= valor;
        }
      
        await prisma.extratoBancario.update({
          where: { id: extratoId },
          data: {
            descricao,
            categoria,
            valor,
            tipo,
          },
        });
      
        await prisma.contaBancaria.update({
          where: { id },
          data: { saldo: saldoAtualizado },
        });
      
        return reply.status(200).send({ saldo: saldoAtualizado });
      });
      
      












      


//Deletar extrato e retonar o valor exato
      fastify.delete('/api/extratos/:id', async (request, reply) => {
        try {
          const extratoId = request.params.id;
      
          // Buscar o extrato pelo ID
          const extrato = await prisma.extratoBancario.findUnique({
            where: { id: extratoId },
            include: { contaBancaria: true },
          });
      
          if (!extrato) {
            reply.code(404).send({ message: 'Extrato não encontrado.' });
            return;
          }
      
          // Verificar o tipo de extrato (despesa ou receita)
          if (extrato.tipo === 'despesa') {
            // Extrato de despesa: devolver o valor
            const valor = extrato.valor;
            // Aqui você pode implementar a lógica para devolver o valor da despesa
      
            // Lógica de devolução da despesa
            // Exemplo: Atualizar o saldo da conta bancária
            const contaId = extrato.contaBancariaId;
            await prisma.contaBancaria.update({
              where: { id: contaId },
              data: { saldo: extrato.contaBancaria.saldo + valor },
            });
      
            // Deletar o extrato
            await prisma.extratoBancario.delete({ where: { id: extratoId } });
      
            reply.send({ message: 'Extrato de despesa deletado com sucesso.' });
          } else if (extrato.tipo === 'receita') {
            // Extrato de receita: estornar o valor
            const valor = extrato.valor;
            // Aqui você pode implementar a lógica para estornar o valor da receita
      
            // Lógica de estorno da receita
            // Exemplo: Atualizar o saldo da conta bancária
            const contaId = extrato.contaBancariaId;
            
            await prisma.contaBancaria.update({
              where: { id: contaId },
              data: { saldo: Number((extrato.contaBancaria.saldo - valor).toFixed(2)) },
            });
      
            // Deletar o extrato
            await prisma.extratoBancario.delete({ where: { id: extratoId } });
      
            reply.send({ message: 'Extrato de receita deletado com sucesso.' });
          } else {
            // Tipo de extrato inválido
            reply.code(400).send({ message: 'Tipo de extrato inválido.' });
          }
        } catch (error) {
          console.error('Erro ao deletar o extrato:', error);
          reply.code(500).send({ message: 'Erro ao deletar o extrato.' });
        }
      });
      



      


      
      fastify.get('/extratos', async (request, reply) => {
        const { startDate, endDate, page = 1, limit = 10 } = request.query;
        try {
          const token = request.headers.authorization?.replace('Bearer ', '');
      
          if (!token) {
            return reply.status(401).send({ error: 'Token de autenticação não fornecido.' });
          }
      
          const decodedToken = jwt.verify(token, 'secret');
      
          if (!decodedToken) {
            return reply.status(401).send({ error: 'Token de autenticação inválido.' });
          }
      
          const userId = decodedToken.userId;
      
          if (!userId) {
            return reply.status(401).send({ error: 'ID do usuário não encontrado no token.' });
          }
      
          const pageNumber = parseInt(page, 10);
          const limitNumber = parseInt(limit, 10);
      
          if (isNaN(pageNumber) || isNaN(limitNumber)) {
            return reply.status(400).send({ message: 'Os parâmetros de paginação devem ser números inteiros.' });
          }
      
          const startIndex = (pageNumber - 1) * limitNumber;
          const endIndex = startIndex + limitNumber;
      
          let extratos;
      
          if (startDate && endDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
              return reply.status(400).send({ message: 'Formato de data inválido. Use o formato yyyy-MM-dd.' });
            }
      
            const start = new Date(startDate);
            const end = new Date(endDate);
      
            end.setDate(end.getDate() + 1);
      
            extratos = await prisma.extratoBancario.findMany({
              where: {
                contaBancaria: {
                  userId: Number(userId),
                },
                data: {
                  gte: start,
                  lt: end,
                },
              },
              include: {
                contaBancaria: true,
              },
              orderBy: {
                data: 'desc', // Ordenar por data em ordem decrescente (mais recente primeiro)
              },
              skip: startIndex,
              take: limitNumber,
            });
          } else {
            extratos = await prisma.extratoBancario.findMany({
              where: {
                contaBancaria: {
                  userId: Number(userId),
                },
              },
              include: {
                contaBancaria: true,
              },
              orderBy: {
                data: 'desc', // Ordenar por data em ordem decrescente (mais recente primeiro)
              },
              skip: startIndex,
              take: limitNumber,
            });
          }
      
          const totalCount = await prisma.extratoBancario.count({
            where: {
              contaBancaria: {
                userId: Number(userId),
              },
            },
          });
      
          const totalPages = Math.ceil(totalCount / limitNumber);
      
          const hasPreviousPage = pageNumber > 1;
          const hasNextPage = endIndex < totalCount;
      
          return reply.status(200).send({
            extratos,
            pageInfo: {
              page: pageNumber,
              limit: limitNumber,
              totalCount,
              totalPages,
              hasPreviousPage,
              hasNextPage,
            },
          });
        } catch (error) {
          console.error(error);
          return reply.status(500).send({ error: 'Internal Server Error' });
        }
      });
      
      
      

      fastify.get('/extratos/months', async (request, reply) => {
        try {
          const token = request.headers.authorization?.replace('Bearer ', '');
      
          if (!token) {
            return reply.status(401).send({ error: 'Token de autenticação não fornecido.' });
          }
      
          const decodedToken = jwt.verify(token, 'secret');
      
          if (!decodedToken) {
            return reply.status(401).send({ error: 'Token de autenticação inválido.' });
          }
      
          const userId = decodedToken.userId;
      
          if (!userId) {
            return reply.status(401).send({ error: 'ID do usuário não encontrado no token.' });
          }
      
          const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
      
          let extratos;
          if (startDate && endDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
              return reply.status(400).send({ message: 'Formato de data inválido. Use o formato yyyy-MM-dd.' });
            }
      
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
      
            extratos = await prisma.extratoBancario.findMany({
              where: {
                data: {
                  gte: start,
                  lt: end,
                },
                contaBancaria: {
                  userId: Number(userId),
                },
              },
              include: {
                contaBancaria: true,
              },
            });
          } else {
            extratos = await prisma.extratoBancario.findMany({
              where: {
                contaBancaria: {
                  userId: Number(userId),
                },
              },
              include: {
                contaBancaria: true,
              },
            });
          }
      
          const extratosPorMes = extratos.reduce((acc, extrato) => {
            const mes = new Date(extrato.data).getMonth() + 1;
            const ano = new Date(extrato.data).getFullYear();
            const chave = `${ano}-${mes}`;
      
            if (!acc[chave]) {
              acc[chave] = [];
            }
      
            acc[chave].push(extrato);
      
            return acc;
          }, {});
      
          return reply.status(200).send({ extratosPorMes });
        } catch (error) {
          console.error(error);
          return reply.status(500).send({ error: 'Internal Server Error' });
        }
      });






      
      
      fastify.get('/progresso-categorias', async (request, reply) => {
        try {
          const token = request.headers.authorization?.replace('Bearer ', '');
      
          if (!token) {
            return reply.status(401).send({ error: 'Token de autenticação não fornecido.' });
          }
      
          const decodedToken = jwt.verify(token, 'secret');
      
          if (!decodedToken) {
            return reply.status(401).send({ error: 'Token de autenticação inválido.' });
          }
      
          const userId = decodedToken.userId;
      
          if (!userId) {
            return reply.status(401).send({ error: 'ID do usuário não encontrado no token.' });
          }

          const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };


          let extratoBancario;
          if(startDate && endDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
              return reply.status(400).send({ message: 'Formato de data inválido. Use o formato yyyy-MM-dd.' });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);

            // Recupere os registros de extrato bancário do banco de dados usando o Prisma
            extratoBancario = await prisma.extratoBancario.findMany({
              where: {
                data: {
                  gte: start,
                  lt: end,
                },
                contaBancaria: {
                  userId: Number(userId),
                },
              },
            });
      
          }else {
            
              // Recupere os registros de extrato bancário do banco de dados usando o Prisma
              extratoBancario = await prisma.extratoBancario.findMany({
                where: {
                  contaBancaria: {
                    userId: Number(userId),
                  },
                },
              });
          
          }
      
          // Crie um objeto para armazenar o valor total gasto em cada categoria
          const gastosPorCategoria = {};
      
          // Percorra os registros de extrato e some os valores gastos para cada categoria
          for (const extrato of extratoBancario) {
            const { categoria, valor } = extrato;
            if (gastosPorCategoria[categoria]) {
              gastosPorCategoria[categoria] += valor;
            } else {
              gastosPorCategoria[categoria] = valor;
            }
          }
      
          // Recupere todas as categorias do banco de dados usando o Prisma
          const categorias = await prisma.category.findMany();
      
          // Crie um array para armazenar o progresso de cada categoria juntamente com o rótulo, ID da categoria e valores estimados
          const progressoCategorias = [];
      
          // Verifique se o usuário possui CategoryUser para todas as categorias e crie automaticamente se não existir
          for (const categoria of categorias) {
            const { id: categoryId } = categoria;
      
            // Verifique se o usuário já possui o CategoryUser para essa categoria
            const categoryUser = await prisma.categoryUser.findFirst({
              where: {
                userId: Number(userId),
                categoryId,
              },
            });
      
            // Se o CategoryUser não existir, crie automaticamente
            if (!categoryUser) {
              await prisma.categoryUser.create({
                data: {
                  categoryId,
                  userId: Number(userId),
                },
              });
            }
          }
      
          // Calcule a porcentagem de progresso para cada categoria
          for (const categoria of categorias) {
            const { id, value, label } = categoria;
            const gasto = gastosPorCategoria[value] || 0;
            let progresso = 0;
      
            // Verifique se o usuário tem valores estimados para essa categoria
            const estimatedValues = await prisma.estimatedValue.findMany({
              where: {
                categoryId: id,
                userId: userId,
              },
            });
      
            if (estimatedValues.length > 0) {
              const estimatedValue = estimatedValues[0].value;
              if (estimatedValue !== 0) {
                progresso = (gasto / estimatedValue) * 100;
              } else {
                progresso = 100; // Defina como 100% quando o valor estimado for zero
              }
            }
      
            progressoCategorias.push({ id, label, progresso, estimatedValues, userId });
          }
      
          reply.send(progressoCategorias);
        } catch (error) {
          console.error(error);
          reply.status(500).send('Error retrieving progresso categorias');
        }
      });




      
      fastify.post('/estimated-values', async (request, reply) => {
        try {
          const token = request.headers.authorization?.replace('Bearer ', '');
      
          if (!token) {
            return reply.status(401).send({ error: 'Token de autenticação não fornecido.' });
          }
      
          const decodedToken = jwt.verify(token, 'secret');
      
          if (!decodedToken) {
            return reply.status(401).send({ error: 'Token de autenticação inválido.' });
          }
      
          const userId = decodedToken.userId;
      
          if (!userId) {
            return reply.status(401).send({ error: 'ID do usuário não encontrado no token.' });
          }
      
          const { categoryId, value } = request.body;
      
          // Verifique se a categoria existe
          const category = await prisma.category.findUnique({ where: { id: categoryId } });
      
          if (!category) {
            return reply.status(404).send({ error: 'Categoria não encontrada.' });
          }
      
          // Verifique se já existe um registro de EstimatedValue para a categoria e usuário especificados
          const existingEstimatedValue = await prisma.estimatedValue.findFirst({
            where: {
              categoryId,
              userId: Number(userId),
            },
          });
      
          let newEstimatedValue;
      
          if (existingEstimatedValue) {
            // Se já existir um registro, atualize o valor estimado
            newEstimatedValue = await prisma.estimatedValue.update({
              where: { id: existingEstimatedValue.id },
              data: { value },
            });
          } else {
            // Se não existir um registro, crie um novo
            newEstimatedValue = await prisma.estimatedValue.create({
              data: {
                categoryId,
                value,
                userId: Number(userId),
              },
            });
          }
      
          reply.send(newEstimatedValue);
        } catch (error) {
          console.error(error);
          reply.status(500).send('Error creating/updating estimated value');
        }
      });
            


    await fastify.listen({
      host:'0.0.0.0',
      port: process.env.PORT ? Number(process.env.PORT) : 3333,

    }).then(() => {
      console.log('HTTP is Running')
    })
}
bootstrap()
