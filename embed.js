const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.MEU_TOKEN;

// Canal onde o painel vai ficar fixo
const CANAL_PAINEL = '1498466480507846827';

const embedData = {};

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_PAINEL);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('set_titulo').setLabel('Título').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('set_descricao').setLabel('Descrição').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('set_imagem').setLabel('Imagem').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('set_canal').setLabel('Canal destino').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('enviar_embed').setLabel('Enviar').setStyle(ButtonStyle.Success)
  );

  await canal.send({ content: '📋 Painel de criação de embed:', components: [row] });
});

client.on('interactionCreate', async (interaction) => {
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
      if (!canal || canal.type !== ChannelType.GuildText) {
        return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(data.titulo || 'Sem título')
        .setDescription(data.descricao || '')
        .setColor(0x00AE86);

      if (data.imagem) embed.setImage(data.imagem);

      await canal.send({ embeds: [embed] });
      return interaction.reply({ content: '✅ Embed enviado!', ephemeral: true });
    }
  }

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

client.login(TOKEN);
