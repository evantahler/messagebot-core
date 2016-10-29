const WordHelper = {
  singleize: function(word){
    word = word.toLowerCase();
    if(word === 'people'){ return 'person'; }
    if(word === 'messages'){ return 'message'; }
    if(word === 'events'){ return 'event'; }
    return word;
  },

  pluralize: function(word){
    word = word.toLowerCase();
    if(word === 'person'){ return 'people'; }
    if(word === 'message'){ return 'messages'; }
    if(word === 'event'){ return 'events'; }
    return word;
  },

  titleize: function(word){
    let words = [];
    let currentWord = '';
    let i = 0;

    while(i < word.length){
      if(currentWord.length === 0){
        currentWord += word[i].toUpperCase();
      }else if(word[i] === word[i].toLowerCase()){
        currentWord += word[i];
      }else{
        words.push(currentWord);
        currentWord = word[i];
      }
      i++;
    }

    if(currentWord.length > 0){ words.push(currentWord); }

    return words.join(' ');
  },

  routeQueryToParams: function(query){
    const topLevelSearchTerms = [
      'type',
      'personGuid',
      'messageGuid',
      'eventGuid',
      'guid',
      'type',
      'createdAt',
      'updatedAt',
      'campaignId',
      'sentAt',
      'openedAt',
      'actedAt',
      'transport',
    ];

    let searchKeys = [];
    let searchValues = [];
    const parts = query.split(' ');
    parts.forEach(function(part){
      if(part !== ''){
        let words = part.split(':');
        if(topLevelSearchTerms.indexOf(words[0]) >= 0){
          searchKeys.push(words[0]);
        }else{
          searchKeys.push('data.' + words[0]);
        }
        searchValues.push(words[1]);
      }
    });

    return [searchKeys, searchValues];
  }
};

export default WordHelper;
