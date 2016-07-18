var sanitizeHtml = require('sanitize-html');
var allowedTags = [
  'html',
  'body',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'p',
  'a',
  'ul',
  'ol',
  'nl',
  'li',
  'b',
  'i',
  'strong',
  'em',
  'strike',
  'code',
  'hr',
  'br',
  'div',
  'span',
  'table',
  'thead',
  'caption',
  'tbody',
  'tr',
  'th',
  'td',
  'pre'
];

module.exports = function(sequelize, DataTypes){
  return sequelize.define('template', {
    'teamId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'name': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'description': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'folder': {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    'transport': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'template': {
      type: DataTypes.TEXT,
      allowNull: true,
      set: function(q){
        this.setDataValue('template', sanitizeHtml(q, {
          allowedTags: allowedTags,
          allowedAttributes: false
        }));
      }
    }
  }, {
    instanceMethods: {
      apiData: function(api){
        return {
          id:           this.id,

          name:         this.name,
          description:  this.description,
          folder:       this.folder,
          transport:    this.transport,
          template:     this.template,

          createdAt:    this.createdAt,
          updatedAt:    this.updatedAt,
        };
      }
    }
  });
};
