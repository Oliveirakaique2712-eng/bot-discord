const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const transcripts = require('discord-html-transcripts'); 

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.MEU_TOKEN;

// 🔧 CONFIGURAÇÃO
const CATEGORIA_ABERTOS = '1497679326383181955';
const CANAL_LOGS = '1498344306153361528';
const CANAL_PAINEL = '1498318862050001056';
const CARGO_STAFF = '1497002956824907916'; // 👈 MUITO IMPORTANTE
const CANAL_PAINEL_EMBED = '1498466480507846827';

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_PAINEL);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_ticket')
    .setPlaceholder('Escolha o tipo de ticket')
    .addOptions([
      { label: '🐛 Bug', value: 'bug' },
      { label: '💰 Compra', value: 'compra' },
      { label: '❓ Ajuda', value: 'ajuda' },
      { label: '🎬 Audiovisual', value: 'audiovisual' },
      { label: '🎨 Design', value: 'design' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  canal.send({
    content: '🎫 Selecione o tipo de atendimento:',
    components: [row]
  });
   // Painel de Embed
  const canalEmbed = await client.channels.fetch(CANAL_PAINEL_EMBED);
  const rowEmbed = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('set_titulo').setLabel('Título').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('set_descricao').setLabel('Descrição').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('set_imagem').setLabel('Imagem').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('set_canal').setLabel('Canal destino').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('enviar_embed').setLabel('Enviar').setStyle(ButtonStyle.Success)
  );
  await canalEmbed.send({ content: '📋 Painel de criação de embed:', components: [rowEmbed] });
});

// FUNÇÃO: verificar se é staff
function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

client.on('interactionCreate', async (interaction) => {

  // Dados temporários por usuário
const embedData = {};

client.on('interactionCreate', async (interaction) => {
  // BOTÕES
  if (interaction.isButton()) {
    if (!embedData[interaction.user.id]) {
      embedData[interaction.user.id] = { titulo: '', descricao: '', imagem: '', canalId: null };
    }

    if (interaction.customId === 'set_titulo') {
      const modal = new ModalBuilder()
        .setCustomId('modal_titulo')
        .setTitle('Definir título')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('titulo').setLabel('Título').setStyle(TextInputStyle.Short)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_descricao') {
      const modal = new ModalBuilder()
        .setCustomId('modal_descricao')
        .setTitle('Definir descrição')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(TextInputStyle.Paragraph)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_imagem') {
      const modal = new ModalBuilder()
        .setCustomId('modal_imagem')
        .setTitle('Definir imagem')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('imagem').setLabel('URL da imagem').setStyle(TextInputStyle.Short).setRequired(false)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_canal') {
      const modal = new ModalBuilder()
        .setCustomId('modal_canal')
        .setTitle('Escolher canal destino')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('canal').setLabel('ID do canal').setStyle(TextInputStyle.Short)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'enviar_embed') {
      const data = embedData[interaction.user.id];
      if (!data.canalId) return interaction.reply({ content: '❌ Defina o canal destino primeiro.', ephemeral: true });

      const canal = interaction.guild.channels.cache.get(data.canalId);
      if (!canal) return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle(data.titulo || 'Sem título')
        .setDescription(data.descricao || '')
        .setColor(0x00AE86);

      if (data.imagem) embed.setImage(data.imagem);

      await canal.send({ embeds: [embed] });
      return interaction.reply({ content: '✅ Embed enviado!', ephemeral: true });
    }
  }

  // MODAIS
  if (interaction.isModalSubmit()) {
    const data = embedData[interaction.user.id];
    if (!data) return;

    if (interaction.customId === 'modal_titulo') {
      data.titulo = interaction.fields.getTextInputValue('titulo');
      await interaction.reply({ content: '✅ Título definido!', ephemeral: true });
    }

    if (interaction.customId === 'modal_descricao') {
      data.descricao = interaction.fields.getTextInputValue('descricao');
      await interaction.reply({ content: '✅ Descrição definida!', ephemeral: true });
    }

    if (interaction.customId === 'modal_imagem') {
      data.imagem = interaction.fields.getTextInputValue('imagem');
      await interaction.reply({ content: '✅ Imagem definida!', ephemeral: true });
    }

    if (interaction.customId === 'modal_canal') {
      data.canalId = interaction.fields.getTextInputValue('canal');
      await interaction.reply({ content: '✅ Canal destino definido!', ephemeral: true });
    }
  }
});


  // MENU
  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {

    const tipo = interaction.values[0];
    
    const ticketID = Math.floor(1000 + Math.random() * 9000);
    
    const canal = await
      interaction.guild.channels.create({
      name: `ticket-${tipo}-${ticketID}`,
      type: ChannelType.GuildText,
      parent: CATEGORIA_ABERTOS,
      topic: interaction.user.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: CARGO_STAFF,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const botoes = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Finalizar')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('chamar_usuario')
        .setLabel('📢 Chamar')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('renomear_ticket')
        .setLabel('✏️ Renomear')
        .setStyle(ButtonStyle.Secondary)
    );

    canal.send({
      content: `🎫 Ticket de <@${interaction.user.id}> | Tipo: **${tipo}**`,
      components: [botoes]
    });

    interaction.reply({ content: '✅ Ticket criado!', ephemeral: true });
  }

  // BOTÕES
  if (interaction.isButton()) {

    // 🔒 FECHAR (SÓ STAFF)
    if (interaction.customId === 'fechar_ticket') {
  try {

    if (!isStaff(interaction.member))
      return interaction.reply({ content: '❌ Apenas staff', ephemeral: true });

    await interaction.reply('📄 Gerando histórico...');

    const messages = await interaction.channel.messages.fetch({ limit: 100 });

    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let log = `📄 TRANSCRIPT DO TICKET\n\n`;

    sorted.forEach(msg => {
      const time = new Date(msg.createdTimestamp).toLocaleString();
      log += `[${time}] ${msg.author.tag}: ${msg.content}\n`;
    });

    const buffer = Buffer.from(log, 'utf-8');

    const donoId = interaction.channel.topic;

    // 🔥 CANAL DE LOG (OBRIGATÓRIO PRA FUNCIONAR)
    const logChannel = interaction.guild.channels.cache.get(CANAL_LOGS);

    if (logChannel) {
      await logChannel.send({
        content: `📄 Ticket de <@${donoId}>`,
        files: [{
          attachment: buffer,
          name: `ticket-${interaction.channel.name}.txt`
        }]
      });
    } else {
      console.log('Canal de log não encontrado');
    }

    // DM (opcional)
    try {
      const user = await client.users.fetch(donoId);

      await user.send({
        content: '📄 Aqui está o histórico do seu ticket:',
        files: [{
          attachment: buffer,
          name: `ticket-${interaction.channel.name}.txt`
        }]
      });

    } catch (e) {
      console.log('Erro DM:', e.message);
    }

    setTimeout(() => {
      interaction.channel.delete();
    }, 5000);

  } catch (err) {
    console.log('ERRO GERAL:', err);
    interaction.reply({ content: '❌ Deu erro ao fechar o ticket', ephemeral: true });
  }
}
    // 📢 CHAMAR (SÓ STAFF)
    if (interaction.customId === 'chamar_usuario') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      const donoId = interaction.channel.topic;

      try {
        const user = await client.users.fetch(donoId);
        await user.send('📢 Você foi chamado no seu ticket!');
        interaction.reply('Mensagem enviada!');
      } catch {
        interaction.reply('Não consegui enviar DM.');
      }
    }

    // ✏️ RENOMEAR (SÓ STAFF)
    if (interaction.customId === 'renomear_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      return interaction.reply({
        content: 'Use: `!renomear novo-nome`',
        ephemeral: true
      });
    }
  }
});

// COMANDOS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ADD MEMBRO
  if (message.content.startsWith('!add')) {
    if (!isStaff(message.member)) return;

    const membro = message.mentions.members.first();
    if (!membro) return message.reply('Marca alguém.');

    await message.channel.permissionOverwrites.edit(membro.id, {
      ViewChannel: true
    });

    message.reply('Membro adicionado!');
  }

  // RENOMEAR
  if (message.content.startsWith('!renomear')) {
    if (!isStaff(message.member)) return;

    const novoNome = message.content.split(' ').slice(1).join('-');
    if (!novoNome) return message.reply('Coloque um nome.');

    await message.channel.setName(`ticket-${novoNome}`);
    message.reply('Nome alterado!');
  }
});

client.login(TOKEN);
